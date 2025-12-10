// =============================================================================
// Coupons API Route
// =============================================================================
// Returns available coupons from Stripe

import { NextResponse } from 'next/server';
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
  } catch (error) {
    console.error('Failed to get Stripe client:', error);
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

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not connected' },
        { status: 400 }
      );
    }

    // Fetch active coupons from Stripe
    const coupons = await stripe.coupons.list({
      limit: 100,
    });

    // Filter to only valid/active coupons
    const activeCoupons = coupons.data.filter(coupon => coupon.valid);

    // Transform to simpler format
    const formattedCoupons = activeCoupons.map(coupon => ({
      id: coupon.id,
      name: coupon.name || coupon.id,
      type: coupon.percent_off ? 'percent' : 'amount',
      value: coupon.percent_off || (coupon.amount_off ? coupon.amount_off / 100 : 0),
      currency: coupon.currency?.toUpperCase() || 'USD',
      duration: coupon.duration,
      durationInMonths: coupon.duration_in_months,
      maxRedemptions: coupon.max_redemptions,
      timesRedeemed: coupon.times_redeemed,
    }));

    return NextResponse.json({
      coupons: formattedCoupons,
    });
  } catch (error) {
    console.error('Coupons API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}
