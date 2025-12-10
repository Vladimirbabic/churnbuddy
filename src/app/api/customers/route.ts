// =============================================================================
// Customers API Route
// =============================================================================
// Returns customer data from Stripe with subscription details
// Requires authentication.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';

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

interface CustomerData {
  id: string;
  email: string;
  name: string;
  country: string | null;
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing' | 'none';
  subscriptionId: string | null;
  mrr: number;
  hasDiscount: boolean;
  cancelAttempts: number;
  createdAt: string;
  currentPlan: string | null;
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
    const limit = parseInt(searchParams.get('limit') || '100');

    // Get Stripe client from user's settings
    const stripe = await getStripeClient(supabase, orgId);

    if (!stripe) {
      return NextResponse.json({
        customers: [],
        total: 0,
        stripeConnected: false,
        message: 'Connect your Stripe account in Settings to see customers',
      });
    }

    // Fetch customers from Stripe
    const stripeCustomers = await stripe.customers.list({
      limit: Math.min(limit, 100),
      expand: ['data.subscriptions'],
    });

    // Get cancel attempt counts from Supabase
    const cancelAttemptCounts: Record<string, number> = {};
    
    if (isSupabaseConfigured()) {
      const serverSupabase = getServerSupabase();
      const { data: events } = await (serverSupabase as ReturnType<typeof getServerSupabase>)
        .from('churn_events')
        .select('customer_id')
        .eq('organization_id', orgId)
        .in('event_type', ['cancellation_attempt', 'feedback_submitted']);

      if (events) {
        events.forEach((event: { customer_id: string }) => {
          cancelAttemptCounts[event.customer_id] = (cancelAttemptCounts[event.customer_id] || 0) + 1;
        });
      }
    }

    // Transform Stripe customers to our format
    const customers: CustomerData[] = stripeCustomers.data.map(customer => {
      // Get the most relevant subscription
      const subscriptions = customer.subscriptions?.data || [];
      const activeSubscription = subscriptions.find(s => s.status === 'active' || s.status === 'trialing');
      const subscription = activeSubscription || subscriptions[0];

      // Calculate MRR from subscription (adjusted for discounts)
      let mrr = 0;
      let currentPlan: string | null = null;
      let hasDiscount = false;

      if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
        const item = subscription.items.data[0];
        if (item?.price) {
          currentPlan = item.price.nickname || item.price.product?.toString() || 'Subscription';
          if (item.price.recurring?.interval === 'month') {
            mrr = (item.price.unit_amount || 0) / 100;
          } else if (item.price.recurring?.interval === 'year') {
            mrr = ((item.price.unit_amount || 0) / 100) / 12;
          }

          // Apply discount if exists
          if (subscription.discount?.coupon) {
            hasDiscount = true;
            const coupon = subscription.discount.coupon;
            if (coupon.percent_off) {
              mrr = mrr * (1 - coupon.percent_off / 100);
            } else if (coupon.amount_off) {
              mrr = Math.max(0, mrr - coupon.amount_off / 100);
            }
          }
        }
      }

      // Determine subscription status
      let subscriptionStatus: CustomerData['subscriptionStatus'] = 'none';
      if (subscription) {
        if (subscription.status === 'active') {
          subscriptionStatus = 'active';
        } else if (subscription.status === 'trialing') {
          subscriptionStatus = 'trialing';
        } else if (subscription.status === 'past_due') {
          subscriptionStatus = 'past_due';
        } else if (subscription.status === 'canceled') {
          subscriptionStatus = 'canceled';
        }
      }

      return {
        id: customer.id,
        email: customer.email || 'No email',
        name: customer.name || '',
        country: customer.address?.country || null,
        subscriptionStatus,
        subscriptionId: subscription?.id || null,
        mrr,
        hasDiscount,
        cancelAttempts: cancelAttemptCounts[customer.id] || 0,
        createdAt: new Date(customer.created * 1000).toISOString(),
        currentPlan,
      };
    });

    // Sort by MRR (highest first), then by cancel attempts
    customers.sort((a, b) => {
      if (b.cancelAttempts !== a.cancelAttempts) {
        return b.cancelAttempts - a.cancelAttempts;
      }
      return b.mrr - a.mrr;
    });

    return NextResponse.json({
      customers,
      total: stripeCustomers.data.length,
      hasMore: stripeCustomers.has_more,
      stripeConnected: true,
    });
  } catch (error) {
    console.error('Customers API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
