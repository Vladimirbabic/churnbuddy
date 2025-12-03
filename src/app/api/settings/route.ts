// =============================================================================
// Settings API Route
// =============================================================================
// Handles saving and retrieving user/organization settings
// Requires authentication - no demo mode

import { NextRequest, NextResponse } from 'next/server';
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

    if (error || !settings) {
      // Return default settings structure for new users
      return NextResponse.json({
        organization_id: orgId,
        onboarding_completed: false,
        onboarding_step: 0,
        stripe_config: { is_connected: false, test_mode: true },
        email_config: { is_connected: false, provider: 'resend' },
        cancel_flow_config: {
          enabled: true,
          discount_percent: 20,
          discount_duration: 3,
          show_survey: true,
        },
        dunning_config: { enabled: true },
        branding: { primary_color: '#3b82f6' },
        notifications: {},
      });
    }

    // Don't expose sensitive keys in response
    const settingsData = settings as Record<string, unknown>;
    const safeSettings = {
      ...settingsData,
      stripe_config: {
        ...(settingsData.stripe_config as Record<string, unknown>),
        secret_key: (settingsData.stripe_config as Record<string, unknown>)?.secret_key ? '••••••••' : undefined,
        webhook_secret: (settingsData.stripe_config as Record<string, unknown>)?.webhook_secret ? '••••••••' : undefined,
      },
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

    // Build update object from request body
    const updateData: Record<string, unknown> = {};

    // Handle onboarding status
    if (body.onboarding_completed !== undefined) {
      updateData.onboarding_completed = body.onboarding_completed;
    }
    if (body.onboarding_step !== undefined) {
      updateData.onboarding_step = body.onboarding_step;
    }

    // Handle Stripe settings
    if (body.stripe) {
      updateData.stripe_config = {
        test_mode: body.stripe.testMode ?? true,
        is_connected: true,
        secret_key: body.stripe.secretKey !== '••••••••' ? body.stripe.secretKey : undefined,
        webhook_secret: body.stripe.webhookSecret !== '••••••••' ? body.stripe.webhookSecret : undefined,
        publishable_key: body.stripe.publishableKey,
      };
    }

    // Handle Email settings
    if (body.email) {
      updateData.email_config = {
        provider: body.email.provider || 'resend',
        is_connected: true,
        api_key: body.email.apiKey !== '••••••••' ? body.email.apiKey : undefined,
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
        primary_color: body.branding.primaryColor || '#3b82f6',
        logo_url: body.branding.logoUrl,
        modal_theme: body.branding.modalTheme,
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
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }

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
