// =============================================================================
// Expiration Reminder Processor (Cron Job Endpoint)
// =============================================================================
// This endpoint should be called periodically (e.g., daily) by a cron service.
// It scans for subscriptions that are about to expire and sends reminder emails.
//
// Security: Requires CRON_SECRET Bearer token
// Usage: GET/POST /api/cron/expiration-reminders
//        Query params: ?dry_run=true (preview without sending)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { sendTemplateEmail, type EmailTemplateType, type EmailContext } from '@/lib/emailService';
import Stripe from 'stripe';

// Types
interface ExpirationReminderSettings {
  expiration_reminder_enabled: boolean;
  expiration_reminder_30_days: boolean;
  expiration_reminder_14_days: boolean;
  expiration_reminder_7_days: boolean;
  expiration_reminder_3_days: boolean;
  expiration_reminder_1_days: boolean;
}

interface SubscriptionToRemind {
  organization_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  current_period_end: string;
  plan: string;
}

interface ReminderResult {
  subscription_id: string;
  customer_email: string;
  reminder_type: string;
  status: 'sent' | 'skipped' | 'failed';
  reason?: string;
}

// Secret key to protect the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET;

export const runtime = 'nodejs';
export const maxDuration = 120; // Allow up to 2 minutes for processing

// Reminder thresholds (days before expiration)
const REMINDER_THRESHOLDS = [
  { days: 30, type: 'expiration_reminder_30' as EmailTemplateType, setting: 'expiration_reminder_30_days', reminderKey: '30_days' },
  { days: 14, type: 'expiration_reminder_14' as EmailTemplateType, setting: 'expiration_reminder_14_days', reminderKey: '14_days' },
  { days: 7, type: 'expiration_reminder_7' as EmailTemplateType, setting: 'expiration_reminder_7_days', reminderKey: '7_days' },
  { days: 3, type: 'expiration_reminder_3' as EmailTemplateType, setting: 'expiration_reminder_3_days', reminderKey: '3_days' },
  { days: 1, type: 'expiration_reminder_1' as EmailTemplateType, setting: 'expiration_reminder_1_days', reminderKey: '1_day' },
] as const;

/**
 * Get Stripe client for an organization
 */
function getStripeClient(apiKey?: string): Stripe {
  const key = apiKey || process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Stripe API key not configured');
  }
  return new Stripe(key, { apiVersion: '2025-04-30.basil' });
}

/**
 * Get expiration reminder settings for an organization
 */
async function getExpirationSettings(
  supabase: ReturnType<typeof getServerSupabase>,
  organizationId: string
): Promise<ExpirationReminderSettings> {
  const defaults: ExpirationReminderSettings = {
    expiration_reminder_enabled: true,
    expiration_reminder_30_days: true,
    expiration_reminder_14_days: true,
    expiration_reminder_7_days: true,
    expiration_reminder_3_days: true,
    expiration_reminder_1_days: true,
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('email_sequences')
      .select('expiration_reminder_enabled, expiration_reminder_30_days, expiration_reminder_14_days, expiration_reminder_7_days, expiration_reminder_3_days, expiration_reminder_1_days')
      .eq('organization_id', organizationId)
      .single();

    if (data) {
      return { ...defaults, ...data };
    }
  } catch (error) {
    console.error(`Failed to fetch expiration settings for org ${organizationId}:`, error);
  }

  return defaults;
}

/**
 * Check if a reminder has already been sent for this subscription/period
 */
async function hasReminderBeenSent(
  supabase: ReturnType<typeof getServerSupabase>,
  subscriptionId: string,
  reminderType: string,
  periodEnd: Date
): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('expiration_reminders_sent')
      .select('id')
      .eq('subscription_id', subscriptionId)
      .eq('reminder_type', reminderType)
      .eq('current_period_end', periodEnd.toISOString())
      .single();

    return !!data;
  } catch {
    return false;
  }
}

/**
 * Record that a reminder has been sent
 */
async function recordReminderSent(
  supabase: ReturnType<typeof getServerSupabase>,
  organizationId: string,
  customerId: string,
  subscriptionId: string,
  reminderType: string,
  periodEnd: Date
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('expiration_reminders_sent')
      .insert({
        organization_id: organizationId,
        customer_id: customerId,
        subscription_id: subscriptionId,
        reminder_type: reminderType,
        current_period_end: periodEnd.toISOString(),
      });
  } catch (error) {
    console.error(`Failed to record reminder sent:`, error);
  }
}

/**
 * Get customer details from Stripe
 */
async function getCustomerDetails(
  stripe: Stripe,
  customerId: string
): Promise<{ email: string; name: string } | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return {
      email: customer.email || '',
      name: customer.name || customer.email?.split('@')[0] || 'Customer',
    };
  } catch (error) {
    console.error(`Failed to fetch customer ${customerId}:`, error);
    return null;
  }
}

/**
 * Get subscription details from Stripe
 */
async function getSubscriptionDetails(
  stripe: Stripe,
  subscriptionId: string
): Promise<{ planName: string; currentPeriodEnd: Date } | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });

    const item = subscription.items.data[0];
    const product = item?.price?.product as Stripe.Product | undefined;
    const planName = product?.name || 'Subscription';
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

    return { planName, currentPeriodEnd };
  } catch (error) {
    console.error(`Failed to fetch subscription ${subscriptionId}:`, error);
    return null;
  }
}

/**
 * Create billing portal link for a customer
 */
async function createBillingPortalLink(
  stripe: Stripe,
  customerId: string,
  returnUrl: string
): Promise<string | null> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session.url;
  } catch (error) {
    console.error(`Failed to create billing portal for ${customerId}:`, error);
    return null;
  }
}

/**
 * Process expiration reminders
 */
async function processExpirationReminders(dryRun: boolean = false): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  results: ReminderResult[];
}> {
  const supabase = getServerSupabase();
  const results: ReminderResult[] = [];
  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const now = new Date();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Get all active subscriptions with their organization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscriptions, error } = await (supabase as any)
    .from('subscriptions')
    .select('organization_id, stripe_customer_id, stripe_subscription_id, current_period_end, plan')
    .eq('status', 'active')
    .not('current_period_end', 'is', null)
    .not('stripe_subscription_id', 'is', null);

  if (error) {
    console.error('Failed to fetch subscriptions:', error);
    throw new Error('Failed to fetch subscriptions');
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { processed: 0, sent: 0, skipped: 0, failed: 0, results: [] };
  }

  // Group subscriptions by organization to batch Stripe calls
  const orgSubscriptions = new Map<string, SubscriptionToRemind[]>();
  for (const sub of subscriptions as SubscriptionToRemind[]) {
    if (!orgSubscriptions.has(sub.organization_id)) {
      orgSubscriptions.set(sub.organization_id, []);
    }
    orgSubscriptions.get(sub.organization_id)!.push(sub);
  }

  // Process each organization
  for (const [organizationId, subs] of orgSubscriptions) {
    // Get settings for this organization
    const settings = await getExpirationSettings(supabase, organizationId);

    if (!settings.expiration_reminder_enabled) {
      for (const sub of subs) {
        results.push({
          subscription_id: sub.stripe_subscription_id,
          customer_email: 'N/A',
          reminder_type: 'N/A',
          status: 'skipped',
          reason: 'Expiration reminders disabled for organization',
        });
        skipped++;
      }
      continue;
    }

    // Get Stripe client (could be per-org in future)
    const stripe = getStripeClient();

    // Process each subscription
    for (const sub of subs) {
      processed++;

      const periodEnd = new Date(sub.current_period_end);
      const daysUntilExpiration = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Check each reminder threshold
      for (const threshold of REMINDER_THRESHOLDS) {
        // Skip if not within the threshold window (e.g., 30 days means send when 29-30 days remaining)
        if (daysUntilExpiration > threshold.days || daysUntilExpiration < threshold.days - 1) {
          continue;
        }

        // Check if this reminder is enabled
        const settingKey = threshold.setting as keyof ExpirationReminderSettings;
        if (!settings[settingKey]) {
          results.push({
            subscription_id: sub.stripe_subscription_id,
            customer_email: 'N/A',
            reminder_type: threshold.reminderKey,
            status: 'skipped',
            reason: `${threshold.reminderKey} reminder disabled`,
          });
          skipped++;
          continue;
        }

        // Check if reminder already sent
        const alreadySent = await hasReminderBeenSent(
          supabase,
          sub.stripe_subscription_id,
          threshold.reminderKey,
          periodEnd
        );

        if (alreadySent) {
          results.push({
            subscription_id: sub.stripe_subscription_id,
            customer_email: 'N/A',
            reminder_type: threshold.reminderKey,
            status: 'skipped',
            reason: 'Reminder already sent for this period',
          });
          skipped++;
          continue;
        }

        // Get customer details from Stripe
        const customer = await getCustomerDetails(stripe, sub.stripe_customer_id);
        if (!customer || !customer.email) {
          results.push({
            subscription_id: sub.stripe_subscription_id,
            customer_email: 'N/A',
            reminder_type: threshold.reminderKey,
            status: 'failed',
            reason: 'Customer not found or no email',
          });
          failed++;
          continue;
        }

        // Get subscription details
        const subDetails = await getSubscriptionDetails(stripe, sub.stripe_subscription_id);
        if (!subDetails) {
          results.push({
            subscription_id: sub.stripe_subscription_id,
            customer_email: customer.email,
            reminder_type: threshold.reminderKey,
            status: 'failed',
            reason: 'Subscription not found in Stripe',
          });
          failed++;
          continue;
        }

        // Create billing portal link
        const billingPortalLink = await createBillingPortalLink(
          stripe,
          sub.stripe_customer_id,
          appUrl
        );

        // Build email context
        const emailContext: EmailContext = {
          name: customer.name,
          email: customer.email,
          customer_id: sub.stripe_customer_id,
          subscription_id: sub.stripe_subscription_id,
          plan_name: subDetails.planName,
          end_date: periodEnd.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          days_remaining: daysUntilExpiration,
          billing_portal_link: billingPortalLink || appUrl,
        };

        if (dryRun) {
          results.push({
            subscription_id: sub.stripe_subscription_id,
            customer_email: customer.email,
            reminder_type: threshold.reminderKey,
            status: 'skipped',
            reason: `DRY RUN: Would send ${threshold.type} email`,
          });
          skipped++;
          continue;
        }

        // Send the email
        const sendResult = await sendTemplateEmail({
          organizationId,
          templateType: threshold.type,
          context: emailContext,
        });

        if (sendResult.success) {
          // Record that we sent this reminder
          await recordReminderSent(
            supabase,
            organizationId,
            sub.stripe_customer_id,
            sub.stripe_subscription_id,
            threshold.reminderKey,
            periodEnd
          );

          results.push({
            subscription_id: sub.stripe_subscription_id,
            customer_email: customer.email,
            reminder_type: threshold.reminderKey,
            status: 'sent',
          });
          sent++;
        } else {
          results.push({
            subscription_id: sub.stripe_subscription_id,
            customer_email: customer.email,
            reminder_type: threshold.reminderKey,
            status: 'failed',
            reason: sendResult.error || 'Unknown error',
          });
          failed++;
        }
      }
    }
  }

  return { processed, sent, skipped, failed, results };
}

export async function GET(request: NextRequest) {
  // Security: Always require cron secret
  if (!CRON_SECRET) {
    console.error('CRON_SECRET environment variable is not configured');
    return NextResponse.json(
      { error: 'Cron endpoint not configured' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    console.warn('Unauthorized cron request attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  // Check for dry_run parameter
  const dryRun = request.nextUrl.searchParams.get('dry_run') === 'true';

  try {
    const result = await processExpirationReminders(dryRun);

    return NextResponse.json({
      message: dryRun ? 'Dry run completed' : 'Expiration reminders processed',
      dry_run: dryRun,
      ...result,
    });
  } catch (error) {
    console.error('Expiration reminder cron error:', error);
    return NextResponse.json(
      { error: 'Failed to process expiration reminders' },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
