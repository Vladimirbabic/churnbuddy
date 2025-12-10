// =============================================================================
// Subscription Management API Route
// =============================================================================
// Get subscription status, cancel subscription, create billing portal session
// Uses Supabase for data persistence

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PLANS } from '@/models/Subscription';
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
    return { supabase, orgId: user?.id || null };
  } catch (error) {
    console.error('Auth error:', error);
    return { supabase: null, orgId: null };
  }
}

// Helper to convert plan name for DB (DB enum still uses 'starter' not 'basic')
function getPlanForDb(plan: string): string {
  return plan === 'basic' ? 'starter' : plan;
}

interface SubscriptionData {
  plan: string;
  status: string;
  cancel_flows_limit: number;
  cancel_flows_used: number;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  stripe_price_id: string | null;
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

// GET: Get current subscription status
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        hasSubscription: false,
        plan: null,
        status: null,
        demoMode: true,
        message: 'Connect Supabase to enable subscription management',
      });
    }

    const { supabase, orgId } = await getAuthenticatedClient();

    if (!orgId || !supabase) {
      return NextResponse.json({
        hasSubscription: false,
        plan: null,
        status: null,
        error: 'Authentication required',
      });
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    if (error || !data) {
      return NextResponse.json({
        hasSubscription: false,
        plan: null,
        status: null,
      });
    }

    const subscription = data as SubscriptionData;

    // If we have a Stripe subscription ID, verify it's still valid
    if (subscription.stripe_subscription_id && stripe) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        );

        // If subscription is canceled or doesn't exist, return no subscription
        if (stripeSubscription.status === 'canceled' ||
            stripeSubscription.status === 'incomplete_expired') {
          // Update DB to reflect canceled status
          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              stripe_subscription_id: null,
              stripe_customer_id: null,
            })
            .eq('organization_id', orgId);

          return NextResponse.json({
            hasSubscription: false,
            plan: null,
            status: null,
            message: 'Your subscription has ended. Choose a plan to continue.',
          });
        }

        // Sync status from Stripe if different
        if (stripeSubscription.status !== subscription.status) {
          await supabase
            .from('subscriptions')
            .update({ status: stripeSubscription.status })
            .eq('organization_id', orgId);
          subscription.status = stripeSubscription.status;
        }
      } catch (stripeError: any) {
        // Subscription doesn't exist in Stripe
        if (stripeError.code === 'resource_missing') {
          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              stripe_subscription_id: null,
              stripe_customer_id: null,
            })
            .eq('organization_id', orgId);

          return NextResponse.json({
            hasSubscription: false,
            plan: null,
            status: null,
            message: 'Your subscription has ended. Choose a plan to continue.',
          });
        }
        console.error('Failed to verify Stripe subscription:', stripeError.message);
      }
    }

    // If status is canceled and no active Stripe subscription, show no subscription
    if (subscription.status === 'canceled' && !subscription.stripe_subscription_id) {
      return NextResponse.json({
        hasSubscription: false,
        plan: null,
        status: null,
        message: 'Your subscription has ended. Choose a plan to continue.',
      });
    }

    // Handle both 'starter' (legacy) and 'basic' (new) plan names
    const planKey = subscription.plan === 'starter' ? 'basic' : subscription.plan;
    const plan = PLANS[planKey as keyof typeof PLANS];

    // Count actual cancel flows from the cancel_flows table
    const { count: cancelFlowsCount } = await supabase
      .from('cancel_flows')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    const actualCancelFlowsUsed = cancelFlowsCount ?? 0;

    // Determine if email sequences are enabled based on plan
    const emailSequencesEnabled = plan?.emailSequencesEnabled ?? (planKey !== 'basic');

    return NextResponse.json({
      hasSubscription: true,
      plan: planKey, // Return normalized plan name
      planName: plan?.name,
      status: subscription.status,
      cancelFlowsLimit: subscription.cancel_flows_limit,
      cancelFlowsUsed: actualCancelFlowsUsed,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end,
      isTrialing: subscription.status === 'trialing',
      features: plan?.features || [],
      emailSequencesEnabled,
      stripeSubscriptionId: subscription.stripe_subscription_id,
      stripeCustomerId: subscription.stripe_customer_id,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}

// POST: Manage subscription (cancel, resume, portal, upgrade)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 400 }
      );
    }

    const { supabase, orgId } = await getAuthenticatedClient();

    if (!orgId || !supabase) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    const subscription = data as SubscriptionData;

    switch (action) {
      case 'cancel': {
        if (!subscription.stripe_subscription_id) {
          return NextResponse.json(
            { error: 'No Stripe subscription found' },
            { status: 400 }
          );
        }

        // Cancel at period end
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        });

        await (supabase as any)
          .from('subscriptions')
          .update({ cancel_at_period_end: true })
          .eq('organization_id', orgId);

        return NextResponse.json({
          success: true,
          message: 'Subscription will be canceled at the end of the billing period',
        });
      }

      case 'resume': {
        if (!subscription.stripe_subscription_id) {
          return NextResponse.json(
            { error: 'No Stripe subscription found' },
            { status: 400 }
          );
        }

        // Resume a subscription that was set to cancel
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: false,
        });

        await (supabase as any)
          .from('subscriptions')
          .update({ cancel_at_period_end: false })
          .eq('organization_id', orgId);

        return NextResponse.json({
          success: true,
          message: 'Subscription resumed',
        });
      }

      case 'portal': {
        if (!subscription.stripe_customer_id) {
          return NextResponse.json(
            { error: 'No Stripe customer found' },
            { status: 400 }
          );
        }

        // Create billing portal session
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: subscription.stripe_customer_id,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/billing`,
        });

        return NextResponse.json({
          url: portalSession.url,
        });
      }

      case 'upgrade': {
        const { newPlan } = body;

        if (!newPlan || !PLANS[newPlan as keyof typeof PLANS]) {
          return NextResponse.json(
            { error: 'Invalid plan' },
            { status: 400 }
          );
        }

        if (!subscription.stripe_subscription_id) {
          return NextResponse.json(
            { error: 'No Stripe subscription found' },
            { status: 400 }
          );
        }

        const newPlanConfig = PLANS[newPlan as keyof typeof PLANS];

        // Get the subscription to find the item ID
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        );

        // Update the subscription with the new price
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: newPlanConfig.priceId,
            },
          ],
          proration_behavior: 'create_prorations',
        });

        // Update local database
        await (supabase as any)
          .from('subscriptions')
          .update({
            plan: getPlanForDb(newPlan),
            stripe_price_id: newPlanConfig.priceId,
            cancel_flows_limit: newPlanConfig.cancelFlowsLimit,
          })
          .eq('organization_id', orgId);

        return NextResponse.json({
          success: true,
          message: `Changed to ${newPlanConfig.name} plan`,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Subscription management error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to manage subscription' },
      { status: 500 }
    );
  }
}
