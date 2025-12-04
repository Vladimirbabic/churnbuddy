// =============================================================================
// MRR History API Route
// =============================================================================
// Returns MRR data points over time for charting.
// Uses Stripe subscription data to calculate historical MRR.

import { NextRequest, NextResponse } from 'next/server';
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
      return null;
    }

    return new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  } catch {
    return null;
  }
}

interface MrrDataPoint {
  date: string;
  mrr: number;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, orgId } = await getAuthenticatedClient();
    if (!orgId || !supabase) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const stripe = await getStripeClient(supabase, orgId);

    if (!stripe) {
      return NextResponse.json({
        history: [],
        stripeConnected: false,
      });
    }

    // Get all subscriptions (including canceled ones for historical data)
    const [activeSubscriptions, canceledSubscriptions] = await Promise.all([
      stripe.subscriptions.list({
        status: 'active',
        limit: 100,
        expand: ['data.discount.coupon'],
      }),
      stripe.subscriptions.list({
        status: 'canceled',
        limit: 100,
      }),
    ]);

    const allSubscriptions = [...activeSubscriptions.data, ...canceledSubscriptions.data];

    // Generate data points for each day
    const history: MrrDataPoint[] = [];
    const now = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateTimestamp = Math.floor(date.getTime() / 1000);

      let mrrForDay = 0;

      // Calculate MRR for this date by checking which subscriptions were active
      allSubscriptions.forEach(sub => {
        const startedAt = sub.created;
        const canceledAt = sub.canceled_at;

        // Check if subscription was active on this date
        const wasActive = startedAt <= dateTimestamp &&
          (!canceledAt || canceledAt > dateTimestamp);

        if (wasActive) {
          const item = sub.items.data[0];
          let subMrr = 0;

          if (item?.price?.recurring?.interval === 'month') {
            subMrr = (item.price.unit_amount || 0) / 100;
          } else if (item?.price?.recurring?.interval === 'year') {
            subMrr = ((item.price.unit_amount || 0) / 100) / 12;
          }

          // Apply discount if present and active on that date
          if (sub.discount && sub.discount.coupon) {
            const coupon = sub.discount.coupon;
            if (coupon.percent_off) {
              subMrr = subMrr * (1 - coupon.percent_off / 100);
            } else if (coupon.amount_off) {
              subMrr = Math.max(0, subMrr - (coupon.amount_off / 100));
            }
          }

          mrrForDay += subMrr;
        }
      });

      history.push({
        date: date.toISOString().split('T')[0],
        mrr: Math.round(mrrForDay * 100) / 100,
      });
    }

    return NextResponse.json({
      history,
      stripeConnected: true,
    });
  } catch (error) {
    console.error('MRR History API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MRR history' },
      { status: 500 }
    );
  }
}
