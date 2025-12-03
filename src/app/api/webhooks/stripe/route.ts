// =============================================================================
// Stripe Webhook Handler (Next.js API Route)
// =============================================================================
// Receives and processes Stripe webhook events for churn management:
// - invoice.payment_failed: Triggers dunning emails to customers
// - customer.subscription.deleted: Logs cancellation events
// - customer.subscription.updated: Tracks subscription changes and recoveries

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, getDeclineReason, createBillingPortalSession } from '@/lib/stripe';
import { sendDunningEmail } from '@/lib/email';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';

// Stripe webhook secret for signature verification
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Disable body parsing - Stripe webhooks require raw body for signature verification
 */
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify the webhook signature to ensure it's from Stripe
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured - skipping database updates');
      return NextResponse.json({ received: true, warning: 'Database not configured' });
    }

    // Route event to appropriate handler
    switch (event.type) {
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, event.data.previous_attributes);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt of the event
    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Event Handlers
// =============================================================================

/**
 * Handle invoice.payment_failed event
 * Sends dunning email to customer and logs the event
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing payment failed event:', invoice.id);

  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) {
    console.error('No customer ID found on invoice');
    return;
  }

  // Get customer details for email
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    console.log('Customer has been deleted, skipping dunning');
    return;
  }

  const customerEmail = customer.email;
  const customerName = customer.name || undefined;

  if (!customerEmail) {
    console.error('No email found for customer:', customerId);
    return;
  }

  // Extract failure details from the invoice
  const failureCode = invoice.last_finalization_error?.code ||
                      (invoice as any).payment_intent?.last_payment_error?.decline_code;
  const failureReason = getDeclineReason(failureCode);

  // Get the hosted invoice URL for customer to pay
  const hostedInvoiceUrl = invoice.hosted_invoice_url || '';

  // Create billing portal URL for customer to update payment method
  let billingPortalUrl: string | undefined;
  try {
    billingPortalUrl = await createBillingPortalSession(customerId, APP_URL);
  } catch (err) {
    console.error('Failed to create billing portal session:', err);
  }

  // Log the payment failed event to database
  const supabase = getServerSupabase();
  await (supabase as any)
    .from('churn_events')
    .insert({
      event_type: 'payment_failed',
      timestamp: new Date().toISOString(),
      customer_id: customerId,
      customer_email: customerEmail,
      subscription_id: typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id,
      invoice_id: invoice.id,
      details: {
        failure_reason: failureReason,
        failure_code: failureCode,
        amount_due: invoice.amount_due,
        currency: invoice.currency,
      },
      source: 'webhook',
      processed: false,
    });

  // Send dunning email to customer
  const emailResult = await sendDunningEmail({
    customerEmail,
    customerName,
    invoiceId: invoice.id,
    amountDue: invoice.amount_due,
    currency: invoice.currency,
    hostedInvoiceUrl,
    billingPortalUrl,
    failureReason,
  });

  // Log that the dunning email was sent
  if (emailResult.success) {
    await (supabase as any)
      .from('churn_events')
      .insert({
        event_type: 'payment_retry_sent',
        timestamp: new Date().toISOString(),
        customer_id: customerId,
        customer_email: customerEmail,
        subscription_id: typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id,
        invoice_id: invoice.id,
        details: {
          amount_due: invoice.amount_due,
          currency: invoice.currency,
        },
        source: 'webhook',
        processed: true,
      });
  }

  console.log(`Dunning email ${emailResult.success ? 'sent' : 'failed'} for invoice ${invoice.id}`);
}

/**
 * Handle customer.subscription.deleted event
 * Logs the cancellation and can trigger follow-up actions
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deleted event:', subscription.id);

  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id;

  if (!customerId) {
    console.error('No customer ID found on subscription');
    return;
  }

  // Get customer email for logging
  let customerEmail: string | undefined;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted) {
      customerEmail = customer.email || undefined;
    }
  } catch (err) {
    console.error('Failed to fetch customer:', err);
  }

  // Calculate MRR impact (for metrics)
  const monthlyAmount = subscription.items.data.reduce((total, item) => {
    const price = item.price;
    if (price.recurring?.interval === 'month') {
      return total + (price.unit_amount || 0) * (item.quantity || 1);
    } else if (price.recurring?.interval === 'year') {
      // Convert yearly to monthly
      return total + Math.round((price.unit_amount || 0) * (item.quantity || 1) / 12);
    }
    return total;
  }, 0);

  // Log the cancellation event
  const supabase = getServerSupabase();
  await (supabase as any)
    .from('churn_events')
    .insert({
      event_type: 'subscription_canceled',
      timestamp: new Date().toISOString(),
      customer_id: customerId,
      customer_email: customerEmail,
      subscription_id: subscription.id,
      details: {
        previous_status: subscription.status,
        mrr_impact: -monthlyAmount, // Negative because it's lost MRR
        plan_id: subscription.items.data[0]?.price.id,
        currency: subscription.currency,
      },
      source: 'webhook',
      processed: true,
    });

  console.log(`Subscription ${subscription.id} cancelled. MRR impact: -${monthlyAmount / 100} ${subscription.currency}`);
}

/**
 * Handle customer.subscription.updated event
 * Detects recoveries (payment succeeded after failure) and plan changes
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  previousAttributes?: Partial<Stripe.Subscription>
) {
  console.log('Processing subscription updated event:', subscription.id);

  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id;

  if (!customerId) {
    console.error('No customer ID found on subscription');
    return;
  }

  // Get customer email for logging
  let customerEmail: string | undefined;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted) {
      customerEmail = customer.email || undefined;
    }
  } catch (err) {
    console.error('Failed to fetch customer:', err);
  }

  // Check if this is a recovery (status changed from past_due/unpaid to active)
  const previousStatus = previousAttributes?.status;
  const isRecovery =
    (previousStatus === 'past_due' || previousStatus === 'unpaid') &&
    subscription.status === 'active';

  const supabase = getServerSupabase();

  if (isRecovery) {
    // Calculate recovered MRR
    const monthlyAmount = subscription.items.data.reduce((total, item) => {
      const price = item.price;
      if (price.recurring?.interval === 'month') {
        return total + (price.unit_amount || 0) * (item.quantity || 1);
      } else if (price.recurring?.interval === 'year') {
        return total + Math.round((price.unit_amount || 0) * (item.quantity || 1) / 12);
      }
      return total;
    }, 0);

    // Log the recovery event
    await (supabase as any)
      .from('churn_events')
      .insert({
        event_type: 'subscription_recovered',
        timestamp: new Date().toISOString(),
        customer_id: customerId,
        customer_email: customerEmail,
        subscription_id: subscription.id,
        details: {
          previous_status: previousStatus,
          new_status: subscription.status,
          mrr_impact: monthlyAmount, // Positive because it's recovered MRR
          plan_id: subscription.items.data[0]?.price.id,
          currency: subscription.currency,
        },
        source: 'webhook',
        processed: true,
      });

    console.log(`Subscription ${subscription.id} recovered! MRR recovered: ${monthlyAmount / 100} ${subscription.currency}`);
  } else if (previousStatus && previousStatus !== subscription.status) {
    // Log other status changes
    await (supabase as any)
      .from('churn_events')
      .insert({
        event_type: 'subscription_updated',
        timestamp: new Date().toISOString(),
        customer_id: customerId,
        customer_email: customerEmail,
        subscription_id: subscription.id,
        details: {
          previous_status: previousStatus,
          new_status: subscription.status,
          plan_id: subscription.items.data[0]?.price.id,
        },
        source: 'webhook',
        processed: true,
      });

    console.log(`Subscription ${subscription.id} status changed: ${previousStatus} -> ${subscription.status}`);
  }
}
