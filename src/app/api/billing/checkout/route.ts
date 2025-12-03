// =============================================================================
// Stripe Checkout Session API Route
// =============================================================================
// Creates Stripe checkout sessions for subscription purchases
// Uses Supabase for data persistence

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PLANS, PlanType } from '@/models/Subscription';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';

const DEFAULT_ORG_ID = 'demo-org-001';

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

    const selectedPlan = PLANS[plan as PlanType];

    // Get existing customer ID from Supabase if available
    let customerId: string | undefined;

    if (isSupabaseConfigured()) {
      const supabase = getServerSupabase();
      const { data: existingSub } = await (supabase as any)
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('organization_id', DEFAULT_ORG_ID)
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
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          organizationId: DEFAULT_ORG_ID,
          plan: plan,
        },
      },
      metadata: {
        organizationId: DEFAULT_ORG_ID,
        plan: plan,
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/billing?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/pricing?canceled=true`,
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
