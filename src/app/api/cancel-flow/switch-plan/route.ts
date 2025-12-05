import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createStripeClient, switchSubscriptionPlan } from '@/lib/stripe';

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// CORS headers for cross-origin embed widget requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: Request) {
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get flow to find organization
    const { data: flow, error: flowError } = await supabase
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
    const { data: settings, error: settingsError } = await supabase
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
    await supabase.from('churn_events').insert({
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
      const { error: rpcError } = await supabase.rpc('increment_flow_saves', { flow_id: flowId });
      if (rpcError) {
        // If RPC doesn't exist or fails, try direct update
        await supabase
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
