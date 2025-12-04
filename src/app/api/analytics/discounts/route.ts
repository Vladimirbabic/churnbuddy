// =============================================================================
// Discount Analytics API Route
// =============================================================================
// Provides analytics data for discounts applied through the cancel flow.
// Returns active discounts, acceptance rates, and savings metrics.

import { NextResponse } from 'next/server';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';

const DEFAULT_ORG_ID = 'demo-org-001';

// Lazy load Stripe utilities
async function getStripeUtils() {
  try {
    const { stripe } = await import('@/lib/stripe');
    return { stripe };
  } catch (error) {
    console.warn('Stripe not configured:', error);
    return null;
  }
}

export async function GET() {
  try {
    const stripeUtils = await getStripeUtils();

    // Get discount stats from churn_events
    let discountStats = {
      totalOffers: 0,
      acceptedOffers: 0,
      acceptanceRate: 0,
      recentDiscounts: [] as Array<{
        customerId: string;
        customerEmail: string | null;
        discountPercent: number;
        appliedAt: string;
        reason: string | null;
      }>,
    };

    if (isSupabaseConfigured()) {
      const supabase = getServerSupabase();

      // Get total offer attempts (offer was shown)
      const { count: totalOffers } = await (supabase as ReturnType<typeof getServerSupabase>)
        .from('churn_events')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', DEFAULT_ORG_ID)
        .in('event_type', ['offer_accepted', 'subscription_canceled']);

      // Get accepted offers
      const { count: acceptedOffers } = await (supabase as ReturnType<typeof getServerSupabase>)
        .from('churn_events')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', DEFAULT_ORG_ID)
        .eq('event_type', 'offer_accepted');

      // Get recent accepted discounts
      const { data: recentEvents } = await (supabase as ReturnType<typeof getServerSupabase>)
        .from('churn_events')
        .select('customer_id, customer_email, details, timestamp')
        .eq('organization_id', DEFAULT_ORG_ID)
        .eq('event_type', 'offer_accepted')
        .order('timestamp', { ascending: false })
        .limit(10);

      discountStats.totalOffers = totalOffers || 0;
      discountStats.acceptedOffers = acceptedOffers || 0;
      discountStats.acceptanceRate = totalOffers
        ? Math.round((acceptedOffers || 0) / totalOffers * 100)
        : 0;

      discountStats.recentDiscounts = (recentEvents || []).map((event: {
        customer_id: string;
        customer_email: string | null;
        details: { discount_offered?: number; cancellation_reason?: string } | null;
        timestamp: string;
      }) => ({
        customerId: event.customer_id,
        customerEmail: event.customer_email,
        discountPercent: event.details?.discount_offered || 0,
        appliedAt: event.timestamp,
        reason: event.details?.cancellation_reason || null,
      }));
    }

    // Get active discounts from Stripe
    let activeDiscounts: Array<{
      customerId: string;
      customerEmail: string | null;
      subscriptionId: string;
      discountPercent: number | null;
      discountAmount: number | null;
      couponName: string | null;
      startedAt: string;
      endsAt: string | null;
    }> = [];

    if (stripeUtils) {
      try {
        // List all active subscriptions with discounts
        const subscriptions = await stripeUtils.stripe.subscriptions.list({
          status: 'active',
          limit: 100,
          expand: ['data.customer', 'data.discount.coupon'],
        });

        activeDiscounts = subscriptions.data
          .filter(sub => sub.discount)
          .map(sub => {
            const customer = sub.customer as { id: string; email?: string | null };
            const discount = sub.discount!;
            return {
              customerId: typeof customer === 'string' ? customer : customer.id,
              customerEmail: typeof customer === 'string' ? null : (customer.email || null),
              subscriptionId: sub.id,
              discountPercent: discount.coupon?.percent_off || null,
              discountAmount: discount.coupon?.amount_off || null,
              couponName: discount.coupon?.name || null,
              startedAt: discount.start ? new Date(discount.start * 1000).toISOString() : new Date().toISOString(),
              endsAt: discount.end ? new Date(discount.end * 1000).toISOString() : null,
            };
          });
      } catch (err) {
        console.error('Failed to fetch Stripe discounts:', err);
      }
    }

    // Calculate estimated savings (simplified - just counts)
    const estimatedMonthlySavings = activeDiscounts.reduce((total, d) => {
      // This is a rough estimate - would need actual subscription amounts for accuracy
      if (d.discountPercent) {
        return total + 1; // Count active percentage discounts
      }
      return total;
    }, 0);

    return NextResponse.json({
      activeDiscounts: activeDiscounts.length,
      activeDiscountsList: activeDiscounts,
      totalOffersShown: discountStats.totalOffers,
      totalOffersAccepted: discountStats.acceptedOffers,
      acceptanceRate: discountStats.acceptanceRate,
      recentDiscounts: discountStats.recentDiscounts,
      estimatedMonthlySavings: estimatedMonthlySavings,
    });
  } catch (error) {
    console.error('Discount analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount analytics' },
      { status: 500 }
    );
  }
}
