// =============================================================================
// Stripe Checkout Session API Route
// =============================================================================
// Creates Stripe checkout sessions for subscription purchases
// Uses Supabase for data persistence

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PLANS, PlanType } from '@/models/Subscription';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
    return { supabase, orgId: user?.id || null, userEmail: user?.email || null };
  } catch (error) {
    console.error('Auth error:', error);
    return { supabase: null, orgId: null, userEmail: null };
  }
}

// Initialize Stripe (will be null if not configured)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, successUrl, cancelUrl } = body;

    // Validate plan
    if (!plan || !PLANS[plan as PlanType]) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        {
          error: 'Stripe is not configured',
          message: 'Please add STRIPE_SECRET_KEY to your environment variables',
          demoMode: true,
        },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { supabase, orgId, userEmail } = await getAuthenticatedClient();

    if (!orgId || !supabase) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const selectedPlan = PLANS[plan as PlanType];

    // Get existing customer ID from Supabase if available
    let customerId: string | undefined;

    if (isSupabaseConfigured()) {
      const { data: existingSub } = await (supabase as any)
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('organization_id', orgId)
        .single();

      const subData = existingSub as { stripe_customer_id?: string } | null;
      if (subData?.stripe_customer_id) {
        customerId = subData.stripe_customer_id;
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      customer_email: customerId ? undefined : userEmail || undefined,
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          organizationId: orgId,
          plan: plan,
        },
      },
      metadata: {
        organizationId: orgId,
        plan: plan,
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?canceled=true`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
