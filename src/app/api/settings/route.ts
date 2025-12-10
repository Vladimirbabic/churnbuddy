// =============================================================================
// Settings API Route
// =============================================================================
// Handles saving and retrieving user/organization settings
// Requires authentication - no demo mode

import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateCsrfToken } from '@/lib/csrf';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';

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

// GET: Retrieve settings
export async function GET(request: NextRequest) {
  try {
    const { supabase, orgId } = await getAuthenticatedClient();

    if (!orgId || !supabase) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data: settings, error } = await (supabase as any)
      .from('settings')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    console.log('GET settings for org:', orgId);
    console.log('Settings found:', !!settings);
    if (error) {
      console.log('GET error:', error.message);
    }
    if (settings?.stripe_config) {
      const stripeConfig = settings.stripe_config as Record<string, unknown>;
      console.log('Has secret_key:', !!stripeConfig.secret_key);
      console.log('Has webhook_secret:', !!stripeConfig.webhook_secret);
    }

    if (error || !settings) {
      // Return default settings structure for new users
      return NextResponse.json({
        organization_id: orgId,
        onboarding_completed: false,
        onboarding_step: 0,
        stripe_config: {
          is_connected: false,
          test: { secret_key: null, webhook_secret: null },
          live: { secret_key: null, webhook_secret: null },
        },
        email_config: { is_connected: false, provider: 'resend' },
        cancel_flow_config: {
          enabled: true,
          discount_percent: 20,
          discount_duration: 3,
          show_survey: true,
        },
        dunning_config: { enabled: true },
        branding: { primary_color: '#3b82f6', theme: 'light' },
        notifications: {},
      });
    }

    // Don't expose sensitive keys in response
    const settingsData = settings as Record<string, unknown>;
    const stripeConfig = settingsData.stripe_config as Record<string, unknown> || {};

    // Handle both old (flat) and new (test/live) stripe_config structures
    const hasNewStructure = stripeConfig.test || stripeConfig.live;
    const testConfig = (stripeConfig.test as Record<string, unknown>) || {};
    const liveConfig = (stripeConfig.live as Record<string, unknown>) || {};

    // Build safe stripe config - convert old structure to new if needed
    const safeStripeConfig = hasNewStructure
      ? {
          is_connected: stripeConfig.is_connected || false,
          test: {
            secret_key: testConfig.secret_key ? '••••••••' : null,
            webhook_secret: testConfig.webhook_secret ? '••••••••' : null,
          },
          live: {
            secret_key: liveConfig.secret_key ? '••••••••' : null,
            webhook_secret: liveConfig.webhook_secret ? '••••••••' : null,
          },
        }
      : {
          // Migrate old structure to new format in response
          is_connected: stripeConfig.is_connected || false,
          test: { secret_key: null, webhook_secret: null },
          live: {
            secret_key: stripeConfig.secret_key ? '••••••••' : null,
            webhook_secret: stripeConfig.webhook_secret ? '••••••••' : null,
          },
        };

    const safeSettings = {
      ...settingsData,
      stripe_config: safeStripeConfig,
      email_config: {
        ...(settingsData.email_config as Record<string, unknown>),
        api_key: (settingsData.email_config as Record<string, unknown>)?.api_key ? '••••••••' : undefined,
      },
    };

    return NextResponse.json(safeSettings);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST: Save settings
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`settings:${clientIp}`, RATE_LIMITS.settings);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  // CSRF protection
  const csrfValid = await validateCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  try {
    const { supabase, orgId } = await getAuthenticatedClient();

    if (!orgId || !supabase) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Fetch existing settings to preserve sensitive keys when masked value is sent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingSettings } = await (supabase as any)
      .from('settings')
      .select('stripe_config, email_config')
      .eq('organization_id', orgId)
      .single();

    const existingStripeConfig = (existingSettings?.stripe_config as Record<string, unknown>) || {};
    const existingEmailConfig = (existingSettings?.email_config as Record<string, unknown>) || {};

    // Build update object from request body
    const updateData: Record<string, unknown> = {};

    // Handle onboarding status
    if (body.onboarding_completed !== undefined) {
      updateData.onboarding_completed = body.onboarding_completed;
    }
    if (body.onboarding_step !== undefined) {
      updateData.onboarding_step = body.onboarding_step;
    }

    // Handle Stripe settings - support both test and live keys
    if (body.stripe) {
      // Get existing test/live configs (handle both old and new structure)
      const existingTestConfig = (existingStripeConfig.test as Record<string, unknown>) || {};
      const existingLiveConfig = (existingStripeConfig.live as Record<string, unknown>) || {};

      // For backwards compatibility: if old structure exists, migrate to live
      const migratedLiveSecretKey = existingStripeConfig.secret_key || existingLiveConfig.secret_key;
      const migratedLiveWebhookSecret = existingStripeConfig.webhook_secret || existingLiveConfig.webhook_secret;

      // Build test config
      const testSecretKey = body.stripe.test?.secretKey && body.stripe.test.secretKey !== '••••••••'
        ? body.stripe.test.secretKey
        : existingTestConfig.secret_key;
      const testWebhookSecret = body.stripe.test?.webhookSecret && body.stripe.test.webhookSecret !== '••••••••'
        ? body.stripe.test.webhookSecret
        : existingTestConfig.webhook_secret;

      // Build live config
      const liveSecretKey = body.stripe.live?.secretKey && body.stripe.live.secretKey !== '••••••••'
        ? body.stripe.live.secretKey
        : migratedLiveSecretKey;
      const liveWebhookSecret = body.stripe.live?.webhookSecret && body.stripe.live.webhookSecret !== '••••••••'
        ? body.stripe.live.webhookSecret
        : migratedLiveWebhookSecret;

      // Determine if connected (at least live keys are set)
      const isConnected = !!liveSecretKey;

      updateData.stripe_config = {
        is_connected: isConnected,
        test: {
          secret_key: testSecretKey || null,
          webhook_secret: testWebhookSecret || null,
        },
        live: {
          secret_key: liveSecretKey || null,
          webhook_secret: liveWebhookSecret || null,
        },
      };
    }

    // Handle Email settings - preserve existing api_key if masked value sent
    if (body.email) {
      updateData.email_config = {
        provider: body.email.provider || 'resend',
        is_connected: true,
        // Preserve existing api_key if masked value '••••••••' is sent
        api_key: body.email.apiKey && body.email.apiKey !== '••••••••'
          ? body.email.apiKey
          : existingEmailConfig.api_key,
        from_email: body.email.fromEmail,
        from_name: body.email.fromName,
        reply_to: body.email.replyTo,
      };
    }

    // Handle Cancel Flow settings
    if (body.cancelFlow) {
      updateData.cancel_flow_config = {
        enabled: body.cancelFlow.enabled ?? true,
        discount_percent: body.cancelFlow.discountPercent ?? 20,
        discount_duration: body.cancelFlow.discountDuration ?? 3,
        show_survey: body.cancelFlow.showSurvey ?? true,
        company_name: body.cancelFlow.companyName,
        custom_reasons: body.cancelFlow.customReasons,
      };
    }

    // Handle Branding settings
    if (body.branding) {
      updateData.branding = {
        company_name: body.branding.companyName,
        full_name: body.branding.fullName,
        website: body.branding.website,
        primary_color: body.branding.primaryColor || '#3b82f6',
        logo_url: body.branding.logoUrl,
        modal_theme: body.branding.modalTheme,
        theme: body.branding.theme || 'light',
      };
    }

    // Handle theme-only updates (for quick theme switching)
    if (body.theme && !body.branding) {
      // Fetch existing branding to preserve other settings
      const { data: existingSettings } = await (supabase as any)
        .from('settings')
        .select('branding')
        .eq('organization_id', orgId)
        .single();

      const existingBranding = (existingSettings?.branding as Record<string, unknown>) || {};
      updateData.branding = {
        ...existingBranding,
        theme: body.theme,
      };
    }

    // Handle Dunning settings
    if (body.dunning) {
      updateData.dunning_config = {
        enabled: body.dunning.enabled ?? true,
        email_sequence: body.dunning.emailSequence,
        max_attempts: body.dunning.maxAttempts,
      };
    }

    // Handle Notification settings
    if (body.notifications) {
      updateData.notifications = {
        email_on_failed_payment: body.notifications.emailOnFailedPayment,
        email_on_cancellation: body.notifications.emailOnCancellation,
        email_on_recovery: body.notifications.emailOnRecovery,
        slack_webhook_url: body.notifications.slackWebhookUrl,
      };
    }

    // Log what we're about to save (without sensitive data)
    console.log('Saving settings for org:', orgId);
    console.log('Update data keys:', Object.keys(updateData));
    if (updateData.stripe_config) {
      const stripeConfig = updateData.stripe_config as Record<string, unknown>;
      console.log('Stripe config has secret_key:', !!stripeConfig.secret_key);
      console.log('Stripe config has webhook_secret:', !!stripeConfig.webhook_secret);
    }

    // Upsert settings
    const { data: settings, error } = await (supabase as any)
      .from('settings')
      .upsert({
        organization_id: orgId,
        ...updateData,
      }, {
        onConflict: 'organization_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to save settings', details: error.message },
        { status: 500 }
      );
    }

    console.log('Settings saved successfully');

    return NextResponse.json({
      success: true,
      onboarding_completed: settings?.onboarding_completed,
    });
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

// PATCH: Update specific settings
export async function PATCH(request: NextRequest) {
  // Rate limiting
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`settings:${clientIp}`, RATE_LIMITS.settings);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  // CSRF protection
  const csrfValid = await validateCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  try {
    const { supabase, orgId } = await getAuthenticatedClient();

    if (!orgId || !supabase) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();

    const { error } = await (supabase as any)
      .from('settings')
      .update(body)
      .eq('organization_id', orgId);

    if (error) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
