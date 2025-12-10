// =============================================================================
// Stripe Webhook Handler
// =============================================================================
// Handles Stripe subscription events to keep our database in sync
// Uses Supabase for data persistence

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PLANS, PlanType } from '@/models/Subscription';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Helper to get plan from price ID
function getPlanFromPriceId(priceId: string): PlanType {
  for (const [planKey, planConfig] of Object.entries(PLANS)) {
    if (planConfig.priceId === priceId) {
      return planKey as PlanType;
    }
  }
  return 'basic'; // default
}

// Helper to convert plan name for DB (DB enum still uses 'starter' not 'basic')
function getPlanForDb(plan: string): string {
  return plan === 'basic' ? 'starter' : plan;
}

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  // Security: Always require webhook signature verification
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 401 }
    );
  }

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', errorMessage);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured - skipping database updates');
    return NextResponse.json({ received: true, warning: 'Database not configured' });
  }

  const supabase = getServerSupabase();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const organizationId = session.metadata?.organizationId || 'demo-org-001';
          const plan = session.metadata?.plan as PlanType || 'basic';
          const planConfig = PLANS[plan];

          // Upsert subscription in Supabase
          await (supabase as any)
            .from('subscriptions')
            .upsert({
              organization_id: organizationId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items.data[0]?.price.id,
              plan: getPlanForDb(plan),
              status: subscription.status,
              cancel_flows_limit: planConfig.cancelFlowsLimit,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              trial_end: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
            }, {
              onConflict: 'organization_id',
            });

          console.log(`Subscription created for org ${organizationId}: ${plan}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price.id;
        const plan = getPlanFromPriceId(priceId);
        const planConfig = PLANS[plan];

        await (supabase as any)
          .from('subscriptions')
          .update({
            stripe_price_id: priceId,
            plan: getPlanForDb(plan),
            status: subscription.status,
            cancel_flows_limit: planConfig.cancelFlowsLimit,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            trial_end: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log(`Subscription updated: ${subscription.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await (supabase as any)
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false,
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log(`Subscription canceled: ${subscription.id}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          // Update subscription period dates
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );

          await (supabase as any)
            .from('subscriptions')
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);
        }

        console.log(`Invoice paid: ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          await (supabase as any)
            .from('subscriptions')
            .update({
              status: 'past_due',
            })
            .eq('stripe_subscription_id', invoice.subscription as string);
        }

        console.log(`Invoice payment failed: ${invoice.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
