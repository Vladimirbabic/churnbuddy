// =============================================================================
// Customer Events API Route
// =============================================================================
// Handles tracking customer activity events for churn intelligence.
// Supports both authenticated users and API key authentication.

import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { trackCustomerEvent, trackCustomerEventsBatch } from '@/lib/customerEvents';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';

// Helper to get authenticated supabase client and user's organization ID
async function getAuthenticatedClient() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return { supabase, orgId: user?.id || null };
  } catch (error) {
    console.error('Auth error:', error);
    return { supabase: null, orgId: null };
  }
}

// Validate event data
interface EventPayload {
  customer_id: string;
  customer_email?: string;
  event_name: string;
  properties?: Record<string, unknown>;
  occurred_at?: string;
}

function validateEvent(event: unknown): event is EventPayload {
  if (!event || typeof event !== 'object') return false;
  const e = event as Record<string, unknown>;
  return (
    typeof e.customer_id === 'string' &&
    e.customer_id.length > 0 &&
    typeof e.event_name === 'string' &&
    e.event_name.length > 0
  );
}

// POST: Track one or more customer events
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(ip, RATE_LIMITS.public);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateCheck.resetTime - Date.now()) / 1000)) } }
      );
    }

    // Authentication
    const { orgId } = await getAuthenticatedClient();
    if (!orgId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Support single event or array of events
    const events = Array.isArray(body) ? body : [body];

    if (events.length === 0) {
      return NextResponse.json(
        { error: 'No events provided' },
        { status: 400 }
      );
    }

    if (events.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 events per request' },
        { status: 400 }
      );
    }

    // Validate all events
    const invalidIndex = events.findIndex((e) => !validateEvent(e));
    if (invalidIndex >= 0) {
      return NextResponse.json(
        { error: `Invalid event at index ${invalidIndex}. Required fields: customer_id, event_name` },
        { status: 400 }
      );
    }

    // Track events
    if (events.length === 1) {
      const event = events[0] as EventPayload;
      const result = await trackCustomerEvent({
        organizationId: orgId,
        customerId: event.customer_id,
        customerEmail: event.customer_email,
        eventName: event.event_name,
        properties: event.properties,
        occurredAt: event.occurred_at ? new Date(event.occurred_at) : undefined,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to track event' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        event_id: result.eventId,
      });
    } else {
      // Batch insert
      const result = await trackCustomerEventsBatch(
        (events as EventPayload[]).map((event) => ({
          organizationId: orgId,
          customerId: event.customer_id,
          customerEmail: event.customer_email,
          eventName: event.event_name,
          properties: event.properties,
          occurredAt: event.occurred_at ? new Date(event.occurred_at) : undefined,
        }))
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.errors.join(', ') || 'Failed to track events' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        inserted: result.inserted,
      });
    }
  } catch (error) {
    console.error('Customer events API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: List recent events for a customer (optional)
export async function GET(request: NextRequest) {
  try {
    const { orgId } = await getAuthenticatedClient();
    if (!orgId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const eventName = searchParams.get('event_name');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customer_id query parameter is required' },
        { status: 400 }
      );
    }

    // Import and use the helper
    const { getCustomerEvents } = await import('@/lib/customerEvents');
    const result = await getCustomerEvents(orgId, customerId, {
      limit: Math.min(limit, 100),
      eventName: eventName || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch events' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      events: result.events,
      total: result.events.length,
    });
  } catch (error) {
    console.error('Customer events GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
