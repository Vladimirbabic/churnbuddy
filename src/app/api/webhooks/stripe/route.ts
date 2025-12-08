// =============================================================================
// Stripe Webhook Handler (Next.js API Route)
// =============================================================================
// Receives and processes Stripe webhook events for churn management:
// - invoice.payment_failed: Triggers dunning email sequence
// - customer.subscription.deleted: Logs cancellation and sends goodbye + win-back emails
// - customer.subscription.updated: Tracks subscription changes and recoveries

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, getDeclineReason, createBillingPortalSession } from '@/lib/stripe';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  scheduleDunningSequence,
  scheduleWinbackSequence,
  cancelPendingEmails,
  getEmailsSentToCustomer,
  recordSequenceAttribution,
  type EmailContext,
} from '@/lib/emailService';

// Stripe webhook secret for signature verification
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Disable body parsing - Stripe webhooks require raw body for signature verification
 */
export const runtime = 'nodejs';

/**
 * Get organization ID from Stripe customer ID
 * Looks up the cancel_flows table to find which org owns this customer
 */
async function getOrganizationFromCustomer(customerId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = getServerSupabase();

    // Look for any churn event with this customer to find the org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: event } = await (supabase as any)
      .from('churn_events')
      .select('organization_id')
      .eq('customer_id', customerId)
      .limit(1)
      .single();

    if (event?.organization_id) {
      return event.organization_id;
    }

    // Fallback: check settings table for orgs with matching Stripe config
    // This assumes there's only one organization (single-tenant mode)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settings } = await (supabase as any)
      .from('settings')
      .select('organization_id')
      .limit(1)
      .single();

    return settings?.organization_id || null;
  } catch {
    return null;
  }
}

/**
 * Get company name from organization settings
 */
async function getCompanyName(organizationId: string): Promise<string> {
  if (!isSupabaseConfigured()) return 'Our Team';

  try {
    const supabase = getServerSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settings } = await (supabase as any)
      .from('settings')
      .select('company_name')
      .eq('organization_id', organizationId)
      .single();

    return settings?.company_name || 'Our Team';
  } catch {
    return 'Our Team';
  }
}

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

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
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
 * Schedules dunning email sequence and logs the event
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

  // Get organization ID
  const organizationId = await getOrganizationFromCustomer(customerId);
  if (!organizationId) {
    console.error('Could not determine organization for customer:', customerId);
    return;
  }

  // Get company name
  const companyName = await getCompanyName(organizationId);

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

  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id;

  // Format amount for display
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: invoice.currency.toUpperCase(),
  }).format(invoice.amount_due / 100);

  // Log the payment failed event to database
  const supabase = getServerSupabase();
  await (supabase as any)
    .from('churn_events')
    .insert({
      organization_id: organizationId,
      event_type: 'payment_failed',
      timestamp: new Date().toISOString(),
      customer_id: customerId,
      customer_email: customerEmail,
      subscription_id: subscriptionId,
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

  // Build email context
  const emailContext: EmailContext = {
    name: customerName,
    email: customerEmail,
    customer_id: customerId,
    subscription_id: subscriptionId,
    amount: formattedAmount,
    update_link: billingPortalUrl || hostedInvoiceUrl,
    company_name: companyName,
    team_name: companyName,
  };

  // Schedule dunning email sequence
  const result = await scheduleDunningSequence({
    organizationId,
    context: emailContext,
    invoiceId: invoice.id,
  });

  // Log that dunning sequence was scheduled
  if (result.success) {
    await (supabase as any)
      .from('churn_events')
      .insert({
        organization_id: organizationId,
        event_type: 'payment_retry_sent',
        timestamp: new Date().toISOString(),
        customer_id: customerId,
        customer_email: customerEmail,
        subscription_id: subscriptionId,
        invoice_id: invoice.id,
        details: {
          amount_due: invoice.amount_due,
          currency: invoice.currency,
          emails_scheduled: result.scheduledCount,
        },
        source: 'webhook',
        processed: true,
      });
  }

  console.log(`Dunning sequence ${result.success ? 'scheduled' : 'failed'} for invoice ${invoice.id} (${result.scheduledCount} emails)`);
}

/**
 * Handle customer.subscription.deleted event
 * Logs the cancellation and schedules goodbye + win-back emails
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

  // Get customer details
  let customerEmail: string | undefined;
  let customerName: string | undefined;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted) {
      customerEmail = customer.email || undefined;
      customerName = customer.name || undefined;
    }
  } catch (err) {
    console.error('Failed to fetch customer:', err);
  }

  // Get organization ID
  const organizationId = await getOrganizationFromCustomer(customerId);
  if (!organizationId) {
    console.error('Could not determine organization for customer:', customerId);
    // Still log the event without sending emails
  }

  // Get company name
  const companyName = organizationId ? await getCompanyName(organizationId) : 'Our Team';

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

  if (organizationId) {
    await (supabase as any)
      .from('churn_events')
      .insert({
        organization_id: organizationId,
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

    // Cancel any pending dunning emails for this customer
    await cancelPendingEmails({
      organizationId,
      customerId,
      templateTypes: ['dunning_1', 'dunning_2', 'dunning_3', 'dunning_4'],
    });

    // Schedule goodbye and win-back emails
    if (customerEmail) {
      const emailContext: EmailContext = {
        name: customerName,
        email: customerEmail,
        customer_id: customerId,
        subscription_id: subscription.id,
        company_name: companyName,
        team_name: companyName,
        reactivate_link: `${APP_URL}/reactivate?customer=${customerId}`,
        return_link: `${APP_URL}/pricing`,
      };

      await scheduleWinbackSequence({
        organizationId,
        context: emailContext,
      });
    }
  }

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

  // Get organization ID
  const organizationId = await getOrganizationFromCustomer(customerId);

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
    if (organizationId) {
      await (supabase as any)
        .from('churn_events')
        .insert({
          organization_id: organizationId,
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

      // Cancel any pending dunning emails since payment succeeded
      await cancelPendingEmails({
        organizationId,
        customerId,
        templateTypes: ['dunning_1', 'dunning_2', 'dunning_3', 'dunning_4'],
      });

      // Check if dunning emails were sent and record attribution
      const dunningEmailsSent = await getEmailsSentToCustomer({
        organizationId,
        customerId,
        sequenceType: 'dunning',
        sinceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      });

      if (dunningEmailsSent.length > 0) {
        // Dunning emails were sent, attribute the recovery to the sequence
        await recordSequenceAttribution({
          organizationId,
          customerId,
          customerEmail,
          sequenceType: 'dunning',
          conversionType: 'payment_recovered',
          emailsSent: dunningEmailsSent.length,
          lastEmailType: dunningEmailsSent[0]?.template_type,
          lastEmailSentAt: dunningEmailsSent[0]?.sent_at ? new Date(dunningEmailsSent[0].sent_at) : undefined,
          subscriptionId: subscription.id,
          details: {
            recovered_amount: monthlyAmount,
            currency: subscription.currency,
            days_since_first_email: dunningEmailsSent.length > 0
              ? Math.floor((Date.now() - new Date(dunningEmailsSent[dunningEmailsSent.length - 1].sent_at).getTime()) / (1000 * 60 * 60 * 24))
              : 0,
          },
        });

        console.log(`Attribution recorded: Dunning sequence led to recovery (${dunningEmailsSent.length} emails sent)`);
      }
    }

    console.log(`Subscription ${subscription.id} recovered! MRR recovered: ${monthlyAmount / 100} ${subscription.currency}`);
  } else if (previousStatus && previousStatus !== subscription.status && organizationId) {
    // Log other status changes
    await (supabase as any)
      .from('churn_events')
      .insert({
        organization_id: organizationId,
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

/**
 * Handle customer.subscription.created event
 * Checks if this is a returning customer (winback) and records attribution
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing subscription created event:', subscription.id);

  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id;

  if (!customerId) {
    console.error('No customer ID found on subscription');
    return;
  }

  // Get organization ID
  const organizationId = await getOrganizationFromCustomer(customerId);
  if (!organizationId) {
    // This might be a new customer, not a returning one - that's okay
    console.log('No organization found for customer, may be a new customer');
    return;
  }

  // Get customer email
  let customerEmail: string | undefined;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted) {
      customerEmail = customer.email || undefined;
    }
  } catch (err) {
    console.error('Failed to fetch customer:', err);
  }

  // Check if this customer previously cancelled and received winback emails
  // This indicates they are a returning customer
  const winbackEmailsSent = await getEmailsSentToCustomer({
    organizationId,
    customerId,
    sequenceType: 'winback',
    sinceDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
  });

  if (winbackEmailsSent.length > 0) {
    // Winback emails were sent, this is a returning customer!
    const monthlyAmount = subscription.items.data.reduce((total, item) => {
      const price = item.price;
      if (price.recurring?.interval === 'month') {
        return total + (price.unit_amount || 0) * (item.quantity || 1);
      } else if (price.recurring?.interval === 'year') {
        return total + Math.round((price.unit_amount || 0) * (item.quantity || 1) / 12);
      }
      return total;
    }, 0);

    // Cancel any pending winback emails since they're back
    await cancelPendingEmails({
      organizationId,
      customerId,
      templateTypes: ['winback_1', 'winback_2', 'winback_3'],
    });

    // Record winback attribution
    await recordSequenceAttribution({
      organizationId,
      customerId,
      customerEmail,
      sequenceType: 'winback',
      conversionType: 'resubscribed',
      emailsSent: winbackEmailsSent.length,
      lastEmailType: winbackEmailsSent[0]?.template_type,
      lastEmailSentAt: winbackEmailsSent[0]?.sent_at ? new Date(winbackEmailsSent[0].sent_at) : undefined,
      subscriptionId: subscription.id,
      details: {
        reactivated_mrr: monthlyAmount,
        currency: subscription.currency,
        plan_id: subscription.items.data[0]?.price.id,
        days_since_first_email: winbackEmailsSent.length > 0
          ? Math.floor((Date.now() - new Date(winbackEmailsSent[winbackEmailsSent.length - 1].sent_at).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      },
    });

    console.log(`Attribution recorded: Winback sequence led to resubscription (${winbackEmailsSent.length} emails sent)`);
  }
}
