// =============================================================================
// Discount Analytics API Route
// =============================================================================
// Provides analytics data for discounts applied through the cancel flow.
// Returns active discounts, acceptance rates, and savings metrics.

import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getStripeClient(supabase: any, orgId: string): Promise<Stripe | null> {
  try {
    const { data: settings } = await supabase
      .from('settings')
      .select('stripe_config')
      .eq('organization_id', orgId)
      .single();

    const stripeConfig = settings?.stripe_config as Record<string, unknown> | null;
    const secretKey = stripeConfig?.secret_key as string | null;

    if (!secretKey) {
      return null;
    }

    return new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // Require authentication
    const { supabase, orgId } = await getAuthenticatedClient();
    if (!orgId || !supabase) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get Stripe client from user's settings
    const stripe = await getStripeClient(supabase, orgId);

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
      // Get total offer attempts (offer was shown)
      const { count: totalOffers } = await (supabase as any)
        .from('churn_events')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .in('event_type', ['offer_accepted', 'subscription_canceled']);

      // Get accepted offers
      const { count: acceptedOffers } = await (supabase as any)
        .from('churn_events')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('event_type', 'offer_accepted');

      // Get recent accepted discounts
      const { data: recentEvents } = await (supabase as any)
        .from('churn_events')
        .select('customer_id, customer_email, details, timestamp')
        .eq('organization_id', orgId)
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
      customerName: string | null;
      customerCountry: string | null;
      subscriptionId: string;
      discountPercent: number | null;
      discountAmount: number | null;
      couponName: string | null;
      startedAt: string;
      endsAt: string | null;
      planName: string | null;
      originalAmount: number | null;
      currentAmount: number | null;
    }> = [];

    if (stripe) {
      try {
        // List all active subscriptions with discounts
        // Note: Stripe limits expansion to 4 levels, so we can't expand data.items.data.price.product
        const subscriptions = await stripe.subscriptions.list({
          status: 'active',
          limit: 100,
          expand: ['data.customer', 'data.discount.coupon', 'data.items.data.price'],
        });

        // Get product IDs to fetch product names separately
        const productIds = new Set<string>();
        subscriptions.data.forEach(sub => {
          sub.items.data.forEach(item => {
            if (item.price?.product && typeof item.price.product === 'string') {
              productIds.add(item.price.product);
            }
          });
        });

        // Fetch all products in one batch
        const productMap = new Map<string, string>();
        if (productIds.size > 0) {
          const products = await stripe.products.list({
            ids: Array.from(productIds),
            limit: 100,
          });
          products.data.forEach(product => {
            productMap.set(product.id, product.name);
          });
        }

        activeDiscounts = subscriptions.data
          .filter(sub => sub.discount)
          .map(sub => {
            const customer = sub.customer as Stripe.Customer;
            const discount = sub.discount!;
            // Calculate total subscription amount from items (this is the base/original price)
            const originalAmountCents = sub.items.data.reduce((total, item) => {
              const unitAmount = item.price?.unit_amount || 0;
              const quantity = item.quantity || 1;
              return total + (unitAmount * quantity);
            }, 0);
            const originalAmount = originalAmountCents / 100;

            // Get the plan/product name from the first item
            const firstItem = sub.items.data[0];
            const productId = typeof firstItem?.price?.product === 'string' ? firstItem.price.product : null;
            const planName = productId ? productMap.get(productId) : (firstItem?.price?.nickname || null);

            // Calculate current amount after discount
            let currentAmount = originalAmount;
            if (discount.coupon?.percent_off) {
              currentAmount = originalAmount * (1 - discount.coupon.percent_off / 100);
            } else if (discount.coupon?.amount_off) {
              currentAmount = originalAmount - (discount.coupon.amount_off / 100);
            }

            return {
              customerId: typeof customer === 'string' ? customer : customer.id,
              customerEmail: typeof customer === 'string' ? null : (customer.email || null),
              customerName: typeof customer === 'string' ? null : (customer.name || null),
              customerCountry: typeof customer === 'string' ? null : (customer.address?.country || null),
              subscriptionId: sub.id,
              discountPercent: discount.coupon?.percent_off || null,
              discountAmount: discount.coupon?.amount_off || null,
              couponName: discount.coupon?.name || null,
              startedAt: discount.start ? new Date(discount.start * 1000).toISOString() : new Date().toISOString(),
              endsAt: discount.end ? new Date(discount.end * 1000).toISOString() : null,
              planName: planName || null,
              originalAmount,
              currentAmount: Math.max(0, currentAmount), // Ensure non-negative
            };
          });
      } catch (err) {
        console.error('Failed to fetch Stripe discounts:', err);
      }
    }

    return NextResponse.json({
      activeDiscounts: activeDiscounts.length,
      activeDiscountsList: activeDiscounts,
      totalOffersShown: discountStats.totalOffers,
      totalOffersAccepted: discountStats.acceptedOffers,
      acceptanceRate: discountStats.acceptanceRate,
      recentDiscounts: discountStats.recentDiscounts,
    });
  } catch (error) {
    console.error('Discount analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount analytics' },
      { status: 500 }
    );
  }
}
