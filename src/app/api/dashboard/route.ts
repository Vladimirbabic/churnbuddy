// =============================================================================
// Dashboard Metrics API Route
// =============================================================================
// Provides aggregated metrics and event data for the founder dashboard.
// Calculates failed payments, cancellations, recoveries, and saved MRR.
// Uses Supabase for data persistence.
// Requires authentication - no demo mode.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to get current user's organization ID
async function getOrganizationId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const supabaseClient = createServerClient(
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
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse date range from query params (defaults to last 30 days)
    const days = parseInt(searchParams.get('period') || searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = getServerSupabase();

    // Get all events for the period
    const { data: events, error } = await (supabase as any)
      .from('churn_events')
      .select('*')
      .eq('organization_id', orgId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        summary: {
          failedPayments: 0,
          cancellations: 0,
          recoveries: 0,
          saved: 0,
          cancellationAttempts: 0,
          lostMrr: 0,
          recoveredMrr: 0,
          saveRate: 0,
          recoveryRate: 0,
        },
        events: [],
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
      });
    }

    // Calculate metrics from events
    const metricsMap: Record<string, { count: number; mrrImpact: number }> = {};

    (events || []).forEach((event: { event_type: string; details: Record<string, unknown> }) => {
      const eventType = event.event_type;
      if (!metricsMap[eventType]) {
        metricsMap[eventType] = { count: 0, mrrImpact: 0 };
      }
      metricsMap[eventType].count++;
      const details = event.details;
      metricsMap[eventType].mrrImpact += (details?.mrr_impact as number) || 0;
    });

    // Calculate summary statistics
    const failedPayments = metricsMap['payment_failed']?.count || 0;
    const cancellations = metricsMap['subscription_canceled']?.count || 0;
    const recoveries = metricsMap['subscription_recovered']?.count || 0;
    const offerAccepted = metricsMap['offer_accepted']?.count || 0;
    const cancellationAttempts = metricsMap['cancellation_attempt']?.count || 0;

    // Calculate MRR impact
    const lostMrr = Math.abs(metricsMap['subscription_canceled']?.mrrImpact || 0);
    const recoveredMrr = metricsMap['subscription_recovered']?.mrrImpact || 0;

    // Calculate save rate (percentage of cancellation attempts that resulted in saves)
    const saveRate = cancellationAttempts > 0
      ? Math.round((offerAccepted / cancellationAttempts) * 100)
      : 0;

    // Calculate recovery rate (percentage of failed payments that were recovered)
    const recoveryRate = failedPayments > 0
      ? Math.round((recoveries / failedPayments) * 100)
      : 0;

    // Format events for the frontend
    interface ChurnEvent {
      id: string;
      event_type: string;
      timestamp: string;
      customer_id: string;
      customer_email: string | null;
      details: Record<string, unknown>;
    }
    const formattedEvents = (events as ChurnEvent[] || []).slice(0, 50).map((event) => {
      const details = event.details;
      return {
        id: event.id,
        type: event.event_type,
        timestamp: event.timestamp,
        customerId: event.customer_id,
        customerEmail: event.customer_email || 'Unknown',
        details: {
          amount: details?.amount_due
            ? `${((details.amount_due as number) / 100).toFixed(2)} ${(details?.currency as string)?.toUpperCase() || 'USD'}`
            : null,
          reason: (details?.cancellation_reason as string) || (details?.failure_reason as string),
          mrrImpact: details?.mrr_impact
            ? `${(details.mrr_impact as number) > 0 ? '+' : ''}${((details.mrr_impact as number) / 100).toFixed(2)}`
            : null,
        },
      };
    });

    return NextResponse.json({
      summary: {
        failedPayments,
        cancellations,
        recoveries,
        saved: offerAccepted,
        cancellationAttempts,
        lostMrr: lostMrr / 100, // Convert to dollars
        recoveredMrr: recoveredMrr / 100,
        saveRate,
        recoveryRate,
      },
      events: formattedEvents,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
