import { NextRequest, NextResponse } from 'next/server';
import { createStripeClient, switchSubscriptionPlan } from '@/lib/stripe';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';

// Security: Get allowed origins from environment
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_APP_URL || '').split(',').filter(Boolean);

// Helper to get CORS headers with origin validation
function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  // Allow if origin matches allowed list, or in development mode
  const isAllowed = ALLOWED_ORIGINS.length === 0 ||
    ALLOWED_ORIGINS.some(allowed => origin === allowed || allowed === '*') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1');

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0] || '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

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

    if (settingsError || !settings?.stripe_config?.secret_key) {
      console.error('Stripe not configured:', settingsError);
      return NextResponse.json(
        { error: 'Stripe not configured for this organization' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Stripe client with organization's key
    const stripeClient = createStripeClient(settings.stripe_config.secret_key);

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
