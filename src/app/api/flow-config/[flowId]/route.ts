// =============================================================================
// Public Flow Config API
// =============================================================================
// Returns cancel flow configuration for embedding on external sites.
// No authentication required - flow ID acts as the identifier.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a service client for public access (read-only)
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params;

    if (!flowId) {
      return NextResponse.json(
        { error: 'Flow ID required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Fetch the flow configuration
    const { data: flow, error } = await supabase
      .from('cancel_flows')
      .select(`
        id,
        theme,
        header_title,
        header_description,
        offer_title,
        offer_description,
        reasons,
        discount_percent,
        discount_duration,
        show_offer,
        is_active
      `)
      .eq('id', flowId)
      .eq('is_active', true)
      .single();

    if (error || !flow) {
      return NextResponse.json(
        { error: 'Flow not found or inactive' },
        { status: 404 }
      );
    }

    // Transform reasons to feedback options format with letters
    const feedbackOptions = (flow.reasons || []).map((reason: { id: string; label: string }, index: number) => ({
      id: reason.id,
      label: reason.label,
      letter: String.fromCharCode(65 + index), // A, B, C, D...
    }));

    // Return the config in a format the widget can use
    const config = {
      flowId: flow.id,
      theme: flow.theme || 'minimal',
      headerTitle: flow.header_title || "We're sorry to see you go",
      headerDescription: flow.header_description || "Before you go, please help us improve by sharing why you're canceling",
      offerTitle: flow.offer_title || "Wait! We have an offer for you",
      offerDescription: flow.offer_description || "",
      feedbackOptions,
      discountPercent: flow.discount_percent || 20,
      discountDuration: flow.discount_duration || 3,
      showOffer: flow.show_offer !== false,
    };

    return NextResponse.json(config, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('Flow config error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flow config' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
