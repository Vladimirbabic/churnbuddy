// =============================================================================
// Expiration Reminder Test Endpoint
// =============================================================================
// This endpoint is for testing expiration reminders in development.
// It allows you to preview what emails would be sent without actually sending them.
//
// Usage:
//   GET /api/test/expiration-reminders
//     - Returns a preview of which reminders would be sent
//
//   POST /api/test/expiration-reminders
//     - Body: { "send_test_email": true, "email": "test@example.com", "template": "expiration_reminder_7" }
//     - Sends a test email to the specified address
//
// IMPORTANT: This endpoint should be disabled or protected in production!

import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { sendTemplateEmail, type EmailTemplateType, type EmailContext } from '@/lib/emailService';
import Stripe from 'stripe';

// Only allow in development
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

interface SubscriptionPreview {
  subscription_id: string;
  customer_id: string;
  plan: string;
  current_period_end: string;
  days_until_expiration: number;
  reminders_due: string[];
  reminders_already_sent: string[];
}

/**
 * Get Stripe client
 */
function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2023-10-16' });
}

/**
 * Get expiration reminder settings for an organization
 */
async function getExpirationSettings(
  supabase: ReturnType<typeof getServerSupabase>,
  organizationId: string
) {
  const defaults = {
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
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (data) {
      return { ...defaults, ...data };
    }
  } catch (error) {
    // Table might not exist yet
  }

  return defaults;
}

/**
 * Check which reminders have been sent
 */
async function getSentReminders(
  supabase: ReturnType<typeof getServerSupabase>,
  subscriptionId: string,
  periodEnd: Date
): Promise<string[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('expiration_reminders_sent')
      .select('reminder_type')
      .eq('subscription_id', subscriptionId)
      .eq('current_period_end', periodEnd.toISOString());

    return data?.map((r: { reminder_type: string }) => r.reminder_type) || [];
  } catch {
    return [];
  }
}

// Reminder thresholds
const REMINDER_THRESHOLDS = [
  { days: 30, type: 'expiration_reminder_30', reminderKey: '30_days' },
  { days: 14, type: 'expiration_reminder_14', reminderKey: '14_days' },
  { days: 7, type: 'expiration_reminder_7', reminderKey: '7_days' },
  { days: 3, type: 'expiration_reminder_3', reminderKey: '3_days' },
  { days: 1, type: 'expiration_reminder_1', reminderKey: '1_day' },
] as const;

export async function GET(request: NextRequest) {
  // Only allow in development or with special header
  if (!IS_DEVELOPMENT && request.headers.get('x-test-mode') !== 'true') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const supabase = getServerSupabase();
  const now = new Date();

  try {
    // Get all active subscriptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriptions, error } = await (supabase as any)
      .from('subscriptions')
      .select('organization_id, stripe_customer_id, stripe_subscription_id, current_period_end, plan, status')
      .eq('status', 'active')
      .not('current_period_end', 'is', null);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions', details: error.message }, { status: 500 });
    }

    const previews: SubscriptionPreview[] = [];
    const settingsCache = new Map<string, Awaited<ReturnType<typeof getExpirationSettings>>>();

    for (const sub of subscriptions || []) {
      if (!sub.stripe_subscription_id || !sub.current_period_end) continue;

      const periodEnd = new Date(sub.current_period_end);
      const daysUntilExpiration = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Get settings (cached)
      if (!settingsCache.has(sub.organization_id)) {
        settingsCache.set(sub.organization_id, await getExpirationSettings(supabase, sub.organization_id));
      }
      const settings = settingsCache.get(sub.organization_id)!;

      // Get already sent reminders
      const sentReminders = await getSentReminders(supabase, sub.stripe_subscription_id, periodEnd);

      // Determine which reminders are due
      const remindersDue: string[] = [];
      for (const threshold of REMINDER_THRESHOLDS) {
        // Check if within threshold window
        if (daysUntilExpiration <= threshold.days && daysUntilExpiration >= threshold.days - 1) {
          // Check if enabled
          const settingKey = `expiration_reminder_${threshold.days === 1 ? '1' : threshold.days}_days` as keyof typeof settings;
          if (settings.expiration_reminder_enabled && settings[settingKey]) {
            if (!sentReminders.includes(threshold.reminderKey)) {
              remindersDue.push(threshold.reminderKey);
            }
          }
        }
      }

      previews.push({
        subscription_id: sub.stripe_subscription_id,
        customer_id: sub.stripe_customer_id,
        plan: sub.plan,
        current_period_end: periodEnd.toISOString(),
        days_until_expiration: daysUntilExpiration,
        reminders_due: remindersDue,
        reminders_already_sent: sentReminders,
      });
    }

    // Sort by days until expiration
    previews.sort((a, b) => a.days_until_expiration - b.days_until_expiration);

    // Filter to only show subscriptions expiring within 35 days or with pending reminders
    const relevantPreviews = previews.filter(
      (p) => p.days_until_expiration <= 35 || p.reminders_due.length > 0
    );

    return NextResponse.json({
      message: 'Expiration reminder preview',
      timestamp: now.toISOString(),
      total_active_subscriptions: subscriptions?.length || 0,
      subscriptions_expiring_soon: relevantPreviews.length,
      subscriptions_with_reminders_due: previews.filter((p) => p.reminders_due.length > 0).length,
      previews: relevantPreviews,
      reminder_thresholds: REMINDER_THRESHOLDS.map((t) => ({
        days_before: t.days,
        template: t.type,
        key: t.reminderKey,
      })),
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Only allow in development
  if (!IS_DEVELOPMENT && request.headers.get('x-test-mode') !== 'true') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { send_test_email, email, template, customer_name } = body;

    if (!send_test_email) {
      return NextResponse.json({ error: 'send_test_email must be true' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const validTemplates: EmailTemplateType[] = [
      'expiration_reminder_30',
      'expiration_reminder_14',
      'expiration_reminder_7',
      'expiration_reminder_3',
      'expiration_reminder_1',
    ];

    const templateType = (template || 'expiration_reminder_7') as EmailTemplateType;
    if (!validTemplates.includes(templateType)) {
      return NextResponse.json({
        error: `Invalid template. Must be one of: ${validTemplates.join(', ')}`,
      }, { status: 400 });
    }

    // Build test context
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const testContext: EmailContext = {
      name: customer_name || 'Test User',
      email: email,
      customer_id: 'cus_test123',
      subscription_id: 'sub_test123',
      plan_name: 'Pro Plan',
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      days_remaining: 7,
      billing_portal_link: `${appUrl}/billing`,
    };

    // Send test email
    const result = await sendTemplateEmail({
      organizationId: 'test-org',
      templateType,
      context: testContext,
    });

    if (result.success) {
      return NextResponse.json({
        message: 'Test email sent successfully',
        email: email,
        template: templateType,
        message_id: result.messageId,
      });
    } else {
      return NextResponse.json({
        error: 'Failed to send test email',
        details: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
