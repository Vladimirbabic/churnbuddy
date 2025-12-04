// =============================================================================
// Dashboard Metrics API Route
// =============================================================================
// Provides aggregated metrics and event data for the founder dashboard.
// Fetches real data from Stripe and combines with Supabase event logs.
// Requires authentication - no demo mode.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

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
  } catch {
    return { supabase: null, orgId: null };
  }
}

// Helper to get Stripe client from user's settings
async function getStripeClient(supabase: ReturnType<typeof createServerClient>, orgId: string): Promise<Stripe | null> {
  try {
    const { data: settings } = await supabase
      .from('settings')
      .select('stripe_config')
      .eq('organization_id', orgId)
      .single();

    const stripeConfig = settings?.stripe_config as Record<string, unknown> | null;
    const secretKey = stripeConfig?.secret_key as string | null;

    if (!secretKey) {
      console.log('No Stripe secret key configured for org:', orgId);
      return null;
    }

    return new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  } catch (error) {
    console.error('Failed to get Stripe client:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { supabase, orgId } = await getAuthenticatedClient();
    if (!orgId || !supabase) {
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
    const startTimestamp = Math.floor(startDate.getTime() / 1000);

    // Initialize metrics
    let failedPayments = 0;
    let cancellations = 0;
    let recoveries = 0;
    let offerAccepted = 0;
    let cancellationAttempts = 0;
    let lostMrr = 0;
    let recoveredMrr = 0;
    let savedMrr = 0; // MRR saved by ChurnBuddy (customers who accepted offers)
    let totalMrr = 0;
    let activeSubscriptions = 0;
    let customersAtRisk = 0; // Customers who started cancel flow
    const formattedEvents: Array<{
      id: string;
      type: string;
      timestamp: string;
      customerId: string;
      customerEmail: string;
      details: {
        amount: string | null;
        reason: string | null;
        mrrImpact: string | null;
      };
    }> = [];

    // Get Stripe client from user's settings
    const stripe = await getStripeClient(supabase, orgId);

    if (stripe) {
      try {
        // Fetch failed invoices (past_due or uncollectible)
        const failedInvoices = await stripe.invoices.list({
          status: 'open',
          created: { gte: startTimestamp },
          limit: 100,
          expand: ['data.customer'],
        });

        failedPayments = failedInvoices.data.filter(inv =>
          inv.attempted && !inv.paid
        ).length;

        // Add failed payment events
        failedInvoices.data
          .filter(inv => inv.attempted && !inv.paid)
          .slice(0, 10)
          .forEach(inv => {
            const customer = inv.customer as Stripe.Customer;
            formattedEvents.push({
              id: inv.id,
              type: 'payment_failed',
              timestamp: new Date(inv.created * 1000).toISOString(),
              customerId: typeof inv.customer === 'string' ? inv.customer : inv.customer?.id || 'unknown',
              customerEmail: customer?.email || 'Unknown',
              details: {
                amount: `$${(inv.amount_due / 100).toFixed(2)}`,
                reason: inv.last_finalization_error?.message || 'Payment failed',
                mrrImpact: `-$${(inv.amount_due / 100).toFixed(2)}`,
              },
            });
          });

        // Fetch active subscriptions for MRR calculation (with discount info)
        const subscriptions = await stripe.subscriptions.list({
          status: 'active',
          limit: 100,
          expand: ['data.customer', 'data.discount.coupon'],
        });

        activeSubscriptions = subscriptions.data.length;

        // Calculate total MRR and saved MRR from discounted subscriptions
        subscriptions.data.forEach(sub => {
          const item = sub.items.data[0];
          let subMrr = 0;

          if (item?.price?.recurring?.interval === 'month') {
            subMrr = item.price.unit_amount || 0;
          } else if (item?.price?.recurring?.interval === 'year') {
            subMrr = (item.price.unit_amount || 0) / 12;
          }

          totalMrr += subMrr;

          // If subscription has a discount, calculate saved MRR
          // savedMrr = the discounted amount they're paying (revenue we kept)
          if (sub.discount && sub.discount.coupon) {
            const coupon = sub.discount.coupon;
            let discountedMrr = subMrr;

            if (coupon.percent_off) {
              // Apply percentage discount: $19 with 50% off = $9.50 saved
              discountedMrr = subMrr * (1 - coupon.percent_off / 100);
            } else if (coupon.amount_off) {
              // Apply fixed amount discount
              discountedMrr = Math.max(0, subMrr - coupon.amount_off);
            }

            savedMrr += discountedMrr;
            offerAccepted++;
          }
        });

        // Fetch canceled subscriptions in period
        const canceledSubs = await stripe.subscriptions.list({
          status: 'canceled',
          created: { gte: startTimestamp },
          limit: 100,
          expand: ['data.customer'],
        });

        cancellations = canceledSubs.data.length;
        lostMrr = canceledSubs.data.reduce((sum, sub) => {
          const item = sub.items.data[0];
          if (item?.price?.recurring?.interval === 'month') {
            return sum + (item.price.unit_amount || 0);
          } else if (item?.price?.recurring?.interval === 'year') {
            return sum + ((item.price.unit_amount || 0) / 12);
          }
          return sum;
        }, 0);

        // Add cancellation events
        canceledSubs.data.slice(0, 10).forEach(sub => {
          const customer = sub.customer as Stripe.Customer;
          const item = sub.items.data[0];
          const mrr = item?.price?.recurring?.interval === 'month'
            ? (item.price.unit_amount || 0)
            : ((item?.price?.unit_amount || 0) / 12);

          formattedEvents.push({
            id: sub.id,
            type: 'subscription_canceled',
            timestamp: new Date((sub.canceled_at || sub.created) * 1000).toISOString(),
            customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || 'unknown',
            customerEmail: customer?.email || 'Unknown',
            details: {
              amount: `$${(mrr / 100).toFixed(2)}/mo`,
              reason: sub.cancellation_details?.reason || 'Canceled',
              mrrImpact: `-$${(mrr / 100).toFixed(2)}`,
            },
          });
        });

        // Fetch recent successful payments (recovered)
        const successfulPayments = await stripe.paymentIntents.list({
          created: { gte: startTimestamp },
          limit: 100,
        });

        // Count payments that were retried and succeeded
        recoveries = successfulPayments.data.filter(pi =>
          pi.status === 'succeeded' && (pi.metadata?.retry === 'true' || pi.metadata?.recovered === 'true')
        ).length;

      } catch (stripeError) {
        console.error('Stripe API error:', stripeError);
        // Continue with Supabase data only
      }
    }

    // Also get events from Supabase (for cancel flow events)
    if (isSupabaseConfigured()) {
      const serverSupabase = getServerSupabase();
      const { data: events } = await (serverSupabase as ReturnType<typeof getServerSupabase>)
        .from('churn_events')
        .select('*')
        .eq('organization_id', orgId)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false })
        .limit(100);

      if (events) {
        // Count cancel flow specific events from Supabase
        events.forEach((event: { event_type: string; subscription_id?: string; details: Record<string, unknown> }) => {
          if (event.event_type === 'cancellation_attempt') {
            cancellationAttempts++;
            customersAtRisk++;
          }
        });

        // Add Supabase events to the list
        events.slice(0, 20).forEach((event: {
          id: string;
          event_type: string;
          timestamp: string;
          customer_id: string;
          customer_email: string | null;
          details: Record<string, unknown>;
        }) => {
          // Don't duplicate if already added from Stripe
          if (!formattedEvents.find(e => e.id === event.id)) {
            formattedEvents.push({
              id: event.id,
              type: event.event_type,
              timestamp: event.timestamp,
              customerId: event.customer_id,
              customerEmail: event.customer_email || 'Unknown',
              details: {
                amount: event.details?.amount_due
                  ? `$${((event.details.amount_due as number) / 100).toFixed(2)}`
                  : null,
                reason: (event.details?.cancellation_reason as string) || (event.details?.failure_reason as string) || null,
                mrrImpact: event.details?.mrr_impact
                  ? `${(event.details.mrr_impact as number) > 0 ? '+' : ''}$${Math.abs((event.details.mrr_impact as number) / 100).toFixed(2)}`
                  : null,
              },
            });
          }
        });
      }
    }

    // Sort events by timestamp
    formattedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate rates
    const saveRate = cancellationAttempts > 0
      ? Math.round((offerAccepted / cancellationAttempts) * 100)
      : 0;

    const recoveryRate = failedPayments > 0
      ? Math.round((recoveries / failedPayments) * 100)
      : 0;

    return NextResponse.json({
      summary: {
        failedPayments,
        cancellations,
        recoveries,
        saved: offerAccepted,
        cancellationAttempts,
        customersAtRisk,
        lostMrr: lostMrr / 100, // Convert to dollars
        recoveredMrr: recoveredMrr / 100,
        savedMrr: savedMrr / 100, // MRR saved by ChurnBuddy
        saveRate,
        recoveryRate,
        totalMrr: totalMrr / 100,
        activeSubscriptions,
      },
      events: formattedEvents.slice(0, 50),
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      stripeConnected: !!stripe,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
