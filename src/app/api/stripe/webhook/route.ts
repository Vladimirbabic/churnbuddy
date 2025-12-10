// =============================================================================
// Unified Stripe Webhook Handler
// =============================================================================
// Main entry point for all Stripe webhooks - handles both:
// 1. Database sync (subscriptions, plans, status)
// 2. Email sequences (dunning, win-back, cancellation)

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PLANS, PlanType } from '@/models/Subscription';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { stripe as stripeLib, getDeclineReason, createBillingPortalSession } from '@/lib/stripe';
import {
  scheduleDunningSequence,
  scheduleWinbackSequence,
  cancelPendingEmails,
  getEmailsSentToCustomer,
  recordSequenceAttribution,
  type EmailContext,
} from '@/lib/emailService';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const runtime = 'nodejs';

// Helper to get plan from price ID
function getPlanFromPriceId(priceId: string): PlanType {
  for (const [planKey, planConfig] of Object.entries(PLANS)) {
    if (planConfig.priceId === priceId) {
      return planKey as PlanType;
    }
  }
  return 'basic';
}

// Get organization ID from customer ID
async function getOrganizationFromCustomer(customerId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = getServerSupabase();
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

    // Fallback: check subscriptions table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sub } = await (supabase as any)
      .from('subscriptions')
      .select('organization_id')
      .eq('stripe_customer_id', customerId)
      .limit(1)
      .single();

    if (sub?.organization_id) {
      return sub.organization_id;
    }

    // Final fallback: first org in settings
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

// Get company name from organization
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
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', errorMessage);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Processing event: ${event.type}`);

  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured - skipping database updates');
    return NextResponse.json({ received: true, warning: 'Database not configured' });
  }

  const supabase = getServerSupabase();

  try {
    switch (event.type) {
      // =========================================================================
      // CHECKOUT & SUBSCRIPTION CREATION
      // =========================================================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const organizationId = session.metadata?.organizationId || 'demo-org-001';
          const plan = session.metadata?.plan as PlanType || 'basic';
          const planConfig = PLANS[plan];

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('subscriptions')
            .upsert({
              organization_id: organizationId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items.data[0]?.price.id,
              plan,
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

          console.log(`[DB] Subscription created for org ${organizationId}: ${plan}`);
        }
        break;
      }

      // =========================================================================
      // SUBSCRIPTION UPDATED (Plan changes, status changes, recoveries)
      // =========================================================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const previousAttributes = (event.data as any).previous_attributes as Partial<Stripe.Subscription> | undefined;
        const priceId = subscription.items.data[0]?.price.id;
        const plan = getPlanFromPriceId(priceId);
        const planConfig = PLANS[plan];

        // 1. Sync to database
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .update({
            stripe_price_id: priceId,
            plan,
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

        console.log(`[DB] Subscription updated: ${subscription.id} -> ${plan} (${subscription.status})`);

        // 2. Check for recovery (payment succeeded after failure)
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id;

        if (customerId) {
          const previousStatus = previousAttributes?.status;
          const isRecovery =
            (previousStatus === 'past_due' || previousStatus === 'unpaid') &&
            subscription.status === 'active';

          if (isRecovery) {
            const organizationId = await getOrganizationFromCustomer(customerId);

            if (organizationId) {
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

              // Log recovery event
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    mrr_impact: monthlyAmount,
                    plan_id: priceId,
                    currency: subscription.currency,
                  },
                  source: 'webhook',
                  processed: true,
                });

              // Cancel pending dunning emails
              await cancelPendingEmails({
                organizationId,
                customerId,
                templateTypes: ['dunning_1', 'dunning_2', 'dunning_3', 'dunning_4'],
              });

              // Check for dunning attribution
              const dunningEmailsSent = await getEmailsSentToCustomer({
                organizationId,
                customerId,
                sequenceType: 'dunning',
                sinceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              });

              if (dunningEmailsSent.length > 0) {
                await recordSequenceAttribution({
                  organizationId,
                  customerId,
                  customerEmail,
                  sequenceType: 'dunning',
                  conversionType: 'payment_recovered',
                  emailsSent: dunningEmailsSent.length,
                  subscriptionId: subscription.id,
                  details: {
                    recoveredAmount: monthlyAmount,
                    currency: subscription.currency,
                  },
                });
              }

              console.log(`[Recovery] Subscription ${subscription.id} recovered. MRR: +${monthlyAmount / 100} ${subscription.currency}`);
            }
          }
        }
        break;
      }

      // =========================================================================
      // SUBSCRIPTION DELETED (Cancellation)
      // =========================================================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // 1. Update database
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false,
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log(`[DB] Subscription canceled: ${subscription.id}`);

        // 2. Handle cancellation emails
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id;

        if (customerId) {
          const organizationId = await getOrganizationFromCustomer(customerId);

          if (organizationId) {
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

            const companyName = await getCompanyName(organizationId);

            // Calculate MRR impact
            const monthlyAmount = subscription.items.data.reduce((total, item) => {
              const price = item.price;
              if (price.recurring?.interval === 'month') {
                return total + (price.unit_amount || 0) * (item.quantity || 1);
              } else if (price.recurring?.interval === 'year') {
                return total + Math.round((price.unit_amount || 0) * (item.quantity || 1) / 12);
              }
              return total;
            }, 0);

            // Log cancellation event
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                  mrr_impact: -monthlyAmount,
                  plan_id: subscription.items.data[0]?.price.id,
                  currency: subscription.currency,
                  cancel_reason: subscription.cancellation_details?.reason,
                  cancel_feedback: subscription.cancellation_details?.feedback,
                },
                source: 'webhook',
                processed: true,
              });

            // Schedule win-back email sequence
            if (customerEmail) {
              const emailContext: EmailContext = {
                name: customerName || customerEmail.split('@')[0],
                email: customerEmail,
                customer_id: customerId,
                subscription_id: subscription.id,
                company_name: companyName,
                team_name: companyName,
              };

              await scheduleWinbackSequence({
                organizationId,
                context: emailContext,
              });

              console.log(`[Email] Win-back sequence scheduled for ${customerEmail}`);
            }
          }
        }
        break;
      }

      // =========================================================================
      // INVOICE PAYMENT SUCCEEDED
      // =========================================================================
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('subscriptions')
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);
        }

        console.log(`[DB] Invoice paid: ${invoice.id}`);
        break;
      }

      // =========================================================================
      // INVOICE PAYMENT FAILED (Triggers dunning sequence)
      // =========================================================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        // 1. Update subscription status
        if (invoice.subscription) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('subscriptions')
            .update({
              status: 'past_due',
            })
            .eq('stripe_subscription_id', invoice.subscription as string);
        }

        console.log(`[DB] Invoice payment failed: ${invoice.id}`);

        // 2. Trigger dunning email sequence
        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : (invoice.customer as Stripe.Customer)?.id;

        if (customerId) {
          const organizationId = await getOrganizationFromCustomer(customerId);

          if (organizationId) {
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

            if (customerEmail) {
              const companyName = await getCompanyName(organizationId);

              // Get decline reason
              const failureCode = (invoice as any).last_payment_error?.decline_code ||
                                  (invoice as any).payment_intent?.last_payment_error?.decline_code;
              const failureReason = getDeclineReason(failureCode);

              // Get billing portal URL
              let billingPortalUrl: string | undefined;
              try {
                billingPortalUrl = await createBillingPortalSession(customerId, APP_URL);
              } catch (err) {
                console.error('Failed to create billing portal session:', err);
              }

              // Format amount
              const formattedAmount = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: invoice.currency.toUpperCase(),
              }).format(invoice.amount_due / 100);

              const subscriptionId = typeof invoice.subscription === 'string'
                ? invoice.subscription
                : invoice.subscription?.id;

              // Log payment failed event
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

              // Schedule dunning sequence
              const emailContext: EmailContext = {
                name: customerName || customerEmail.split('@')[0],
                email: customerEmail,
                customer_id: customerId,
                subscription_id: subscriptionId,
                amount: formattedAmount,
                update_link: billingPortalUrl || invoice.hosted_invoice_url || '',
                company_name: companyName,
                team_name: companyName,
              };

              const result = await scheduleDunningSequence({
                organizationId,
                context: emailContext,
                invoiceId: invoice.id,
              });

              if (result.success) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

                console.log(`[Email] Dunning sequence scheduled for ${customerEmail} (${result.scheduledCount} emails)`);
              }
            }
          }
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
