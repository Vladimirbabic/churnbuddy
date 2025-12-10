import { NextRequest, NextResponse } from 'next/server';
import { createStripeClient, switchSubscriptionPlan } from '@/lib/stripe';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';

// Helper to get CORS headers - allow all origins for embed widget
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const corsHeaders = getCorsHeaders();
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders();

  // Rate limiting (restrictive for plan switches)
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`switch-plan:${clientIp}`, RATE_LIMITS.discountApply);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const body = await request.json();

    const {
      flowId,
      subscriptionId,
      newPriceId,
      customerId,
      customerEmail,
      planName,
      discountPercent,
      discountDurationMonths = 3, // Default 3 months discount
    } = body;
    // Extract mode from request, default to 'live' for backwards compatibility
    const mode: 'test' | 'live' = body.mode === 'test' ? 'test' : 'live';

    // Validate required fields
    if (!flowId || !subscriptionId || !newPriceId) {
      return NextResponse.json(
        { error: 'Missing required fields: flowId, subscriptionId, newPriceId' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Security: Use server supabase instead of service role key
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = getServerSupabase();

    // Get flow to find organization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: flow, error: flowError } = await (supabase as any)
      .from('cancel_flows')
      .select('organization_id')
      .eq('id', flowId)
      .single();

    if (flowError || !flow) {
      console.error('Flow not found:', flowError);
      return NextResponse.json({ error: 'Flow not found' }, { status: 404, headers: corsHeaders });
    }

    const organizationId = flow.organization_id;

    // Get organization's Stripe settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settings, error: settingsError } = await (supabase as any)
      .from('settings')
      .select('stripe_config')
      .eq('organization_id', organizationId)
      .single();

    if (settingsError || !settings?.stripe_config) {
      console.error('Stripe not configured:', settingsError);
      return NextResponse.json(
        { error: 'Stripe not configured for this organization' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the appropriate Stripe key based on mode
    // Support both new (test/live) and old (flat) structures
    const stripeConfig = settings.stripe_config;
    let stripeSecretKey: string | null = null;

    // Check for new structure (test/live keys)
    const modeConfig = stripeConfig[mode] as { secret_key?: string } | undefined;
    if (modeConfig?.secret_key) {
      stripeSecretKey = modeConfig.secret_key;
    }
    // Fall back to old structure (single secret_key) - treat as live
    else if (mode === 'live' && stripeConfig.secret_key) {
      stripeSecretKey = stripeConfig.secret_key;
    }

    if (!stripeSecretKey) {
      console.error(`No ${mode} Stripe key configured`);
      return NextResponse.json(
        { error: `Stripe ${mode} keys not configured for this organization` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Stripe client with organization's key
    const stripeClient = createStripeClient(stripeSecretKey);

    // Switch the subscription
    const result = await switchSubscriptionPlan(
      stripeClient,
      subscriptionId,
      newPriceId,
      discountPercent,
      discountDurationMonths
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to switch plan' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Log the plan switch event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('churn_events').insert({
      organization_id: organizationId,
      event_type: 'plan_switched',
      customer_id: customerId || 'unknown',
      customer_email: customerEmail,
      subscription_id: subscriptionId,
      details: {
        flowId,
        mode, // Track which Stripe environment was used
        newPriceId,
        planName,
        discountPercent,
        discountDurationMonths,
        previousPriceId: result.subscription?.items?.data[0]?.price?.id,
      },
      source: 'cancel_flow',
    });

    // Update flow stats - increment saves
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rpcError } = await (supabase as any).rpc('increment_flow_saves', { flow_id: flowId });
      if (rpcError) {
        // If RPC doesn't exist or fails, try direct update
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('cancel_flows')
          .update({ saves: 1 })
          .eq('id', flowId);
      }
    } catch {
      // Silently fail - stats update is not critical
    }

    return NextResponse.json({
      success: true,
      message: `Successfully switched to ${planName || 'new plan'}`,
      subscription: {
        id: result.subscription?.id,
        status: result.subscription?.status,
        currentPeriodEnd: result.subscription?.current_period_end,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error switching plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
