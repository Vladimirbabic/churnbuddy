// =============================================================================
// Customer Detail API Route
// =============================================================================
// Returns detailed customer data including subscription timeline and churn events

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

interface ChurnEvent {
  id: string;
  event_type: string;
  timestamp: string;
  details: Record<string, unknown>;
  source: string;
}

interface TimelineEvent {
  type: 'subscription_started' | 'discount_applied' | 'cancellation_attempt' | 'offer_accepted' | 'offer_declined' | 'subscription_canceled' | 'payment_failed' | 'payment_recovered';
  date: string;
  description: string;
  details?: Record<string, unknown>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;

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

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not connected' },
        { status: 400 }
      );
    }

    // Fetch customer from Stripe with subscriptions
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['subscriptions.data.discount.coupon'],
    });

    if (customer.deleted) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get active subscription
    const subscriptions = (customer as Stripe.Customer).subscriptions?.data || [];
    const activeSubscription = subscriptions.find(s => s.status === 'active' || s.status === 'trialing');
    const subscription = activeSubscription || subscriptions[0];

    // Calculate subscription duration
    let subscriptionStartDate: string | null = null;
    let daysSubscribed = 0;
    let currentPlan: string | null = null;
    let mrr = 0;
    let discountInfo: {
      type: 'percent' | 'amount';
      value: number;
      name: string;
      endsAt: string | null;
      daysRemaining: number | null;
    } | null = null;

    if (subscription) {
      subscriptionStartDate = new Date(subscription.start_date * 1000).toISOString();
      daysSubscribed = Math.floor((Date.now() - subscription.start_date * 1000) / (1000 * 60 * 60 * 24));

      const item = subscription.items.data[0];
      if (item?.price) {
        currentPlan = item.price.nickname || item.price.product?.toString() || 'Subscription';
        if (item.price.recurring?.interval === 'month') {
          mrr = (item.price.unit_amount || 0) / 100;
        } else if (item.price.recurring?.interval === 'year') {
          mrr = ((item.price.unit_amount || 0) / 100) / 12;
        }
      }

      // Get discount info
      if (subscription.discount?.coupon) {
        const coupon = subscription.discount.coupon;
        const endsAt = subscription.discount.end ? new Date(subscription.discount.end * 1000).toISOString() : null;
        const daysRemaining = subscription.discount.end
          ? Math.max(0, Math.ceil((subscription.discount.end * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))
          : null;

        discountInfo = {
          type: coupon.percent_off ? 'percent' : 'amount',
          value: coupon.percent_off || (coupon.amount_off ? coupon.amount_off / 100 : 0),
          name: coupon.name || coupon.id,
          endsAt,
          daysRemaining,
        };
      }
    }

    // Calculate lifetime value from all successful charges
    let lifetimeValue = 0;
    try {
      const charges = await stripe.charges.list({
        customer: customerId,
        limit: 100,
      });
      lifetimeValue = charges.data
        .filter(charge => charge.status === 'succeeded' && !charge.refunded)
        .reduce((sum, charge) => sum + (charge.amount / 100), 0);
    } catch (error) {
      console.error('Failed to fetch charges for lifetime value:', error);
    }

    // Fetch churn events from Supabase
    const timeline: TimelineEvent[] = [];

    if (isSupabaseConfigured()) {
      const serverSupabase = getServerSupabase();
      const { data: events } = await (serverSupabase as ReturnType<typeof getServerSupabase>)
        .from('churn_events')
        .select('*')
        .eq('organization_id', orgId)
        .eq('customer_id', customerId)
        .order('timestamp', { ascending: false });

      if (events) {
        events.forEach((event: ChurnEvent) => {
          const eventDate = new Date(event.timestamp).toISOString();

          switch (event.event_type) {
            case 'cancellation_attempt':
              timeline.push({
                type: 'cancellation_attempt',
                date: eventDate,
                description: 'Customer attempted to cancel',
                details: event.details,
              });
              break;
            case 'offer_accepted':
              timeline.push({
                type: 'offer_accepted',
                date: eventDate,
                description: `Accepted ${event.details?.discount_percent || event.details?.discount_offered}% discount offer`,
                details: event.details,
              });
              break;
            case 'offer_declined':
              timeline.push({
                type: 'offer_declined',
                date: eventDate,
                description: 'Declined retention offer',
                details: event.details,
              });
              break;
            case 'subscription_canceled':
              timeline.push({
                type: 'subscription_canceled',
                date: eventDate,
                description: 'Subscription canceled',
                details: event.details,
              });
              break;
            case 'payment_failed':
              timeline.push({
                type: 'payment_failed',
                date: eventDate,
                description: `Payment failed: ${event.details?.failure_reason || 'Unknown reason'}`,
                details: event.details,
              });
              break;
            case 'payment_recovered':
              timeline.push({
                type: 'payment_recovered',
                date: eventDate,
                description: 'Payment recovered',
                details: event.details,
              });
              break;
          }
        });
      }
    }

    // Add subscription start to timeline
    if (subscriptionStartDate) {
      timeline.push({
        type: 'subscription_started',
        date: subscriptionStartDate,
        description: `Started subscription: ${currentPlan || 'Unknown plan'}`,
      });
    }

    // Sort timeline by date (newest first)
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        country: customer.address?.country || null,
        createdAt: new Date(customer.created * 1000).toISOString(),
      },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        startDate: subscriptionStartDate,
        daysSubscribed,
        currentPlan,
        mrr,
        lifetimeValue,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        daysUntilCancellation: subscription.cancel_at_period_end
          ? Math.max(0, Math.ceil((subscription.current_period_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))
          : subscription.cancel_at
            ? Math.max(0, Math.ceil((subscription.cancel_at * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))
            : null,
      } : null,
      discount: discountInfo,
      timeline,
      stats: {
        cancellationAttempts: timeline.filter(e => e.type === 'cancellation_attempt').length,
        offersAccepted: timeline.filter(e => e.type === 'offer_accepted').length,
        offersDeclined: timeline.filter(e => e.type === 'offer_declined').length,
        paymentFailures: timeline.filter(e => e.type === 'payment_failed').length,
      },
    });
  } catch (error) {
    console.error('Customer detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer details' },
      { status: 500 }
    );
  }
}
