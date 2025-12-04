// =============================================================================
// Cancel Flows API Route
// =============================================================================
// CRUD operations for cancel flow configurations
// Uses Supabase for data persistence
// Requires authentication - no demo mode.

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
  } catch {
    return { supabase: null, orgId: null };
  }
}

// Default cancel flow reasons
const DEFAULT_REASONS = [
  { id: 'too_expensive', label: 'Too expensive' },
  { id: 'not_using', label: 'Not using it enough' },
  { id: 'missing_features', label: 'Missing features I need' },
  { id: 'found_alternative', label: 'Found a better alternative' },
  { id: 'technical_issues', label: 'Technical issues or bugs' },
  { id: 'poor_support', label: 'Poor customer support' },
  { id: 'temporary', label: 'Just need a break (temporary)' },
  { id: 'other', label: 'Other reason' },
];

// GET: Retrieve all cancel flows with stats from churn_events
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get single cancel flow with stats
      const { data: flow, error } = await (supabase as any)
        .from('cancel_flows')
        .select('*')
        .eq('id', id)
        .eq('organization_id', orgId)
        .single();

      if (error || !flow) {
        return NextResponse.json({ error: 'Cancel flow not found' }, { status: 404 });
      }

      // Get stats for this flow from churn_events
      const stats = await getFlowStats(supabase, orgId);
      const flowStats = stats[flow.id] || { impressions: 0, saves: 0, feedbackResults: {} };

      return NextResponse.json({
        flow: { ...flow, ...flowStats }
      });
    }

    // Get all cancel flows for organization
    const { data: flows, error } = await (supabase as any)
      .from('cancel_flows')
      .select('*')
      .eq('organization_id', orgId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ flows: [] });
    }

    // Get aggregated stats from churn_events
    const stats = await getFlowStats(supabase, orgId);

    // Merge stats into flows
    const flowsWithStats = (flows || []).map((flow: Record<string, unknown>) => {
      const flowStats = stats[flow.id as string] || { impressions: 0, saves: 0, feedbackResults: {} };
      return { ...flow, ...flowStats };
    });

    return NextResponse.json({ flows: flowsWithStats });
  } catch (error) {
    console.error('Cancel Flows GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cancel flows' },
      { status: 500 }
    );
  }
}

// Helper to get flow stats from churn_events
async function getFlowStats(supabase: ReturnType<typeof createServerClient>, orgId: string) {
  const stats: Record<string, {
    impressions: number;
    saves: number;
    cancellations: number;
    feedbackResults: Record<string, number>;
    otherFeedback: string[];
  }> = {};

  try {
    // Get all churn events for this organization
    const { data: events, error } = await (supabase as any)
      .from('churn_events')
      .select('event_type, details, flow_id')
      .eq('organization_id', orgId)
      .in('event_type', ['cancellation_attempt', 'offer_accepted', 'feedback_submitted', 'subscription_canceled']);

    if (error || !events) {
      console.error('Error fetching churn events:', error);
      return stats;
    }

    // Aggregate stats by flow
    for (const event of events) {
      const flowId = event.flow_id || 'default';

      if (!stats[flowId]) {
        stats[flowId] = { impressions: 0, saves: 0, cancellations: 0, feedbackResults: {}, otherFeedback: [] };
      }

      if (event.event_type === 'cancellation_attempt') {
        stats[flowId].impressions++;

        // Track feedback reasons
        const reason = event.details?.cancellation_reason || event.details?.reason;
        if (reason) {
          stats[flowId].feedbackResults[reason] = (stats[flowId].feedbackResults[reason] || 0) + 1;
        }

        // Capture "other" feedback text
        const otherText = event.details?.other_feedback || event.details?.cancellation_feedback;
        if (otherText && typeof otherText === 'string' && otherText.trim()) {
          stats[flowId].otherFeedback.push(otherText.trim());
        }
      } else if (event.event_type === 'offer_accepted') {
        stats[flowId].saves++;
      } else if (event.event_type === 'subscription_canceled') {
        stats[flowId].cancellations++;
      }
    }

    // Also add stats to 'default' key for flows without flow_id tracking
    // (aggregate all stats if no flow_id is recorded)
    if (!Object.keys(stats).some(k => k !== 'default')) {
      // If we only have 'default' stats, apply to all flows
      return stats;
    }
  } catch (err) {
    console.error('Error aggregating flow stats:', err);
  }

  return stats;
}

// POST: Create or update a cancel flow
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

    console.log('Cancel flow save request:', JSON.stringify(body, null, 2));

    if (body.id) {
      // Update existing cancel flow
      // If setting as default, unset other defaults first
      if (body.is_default || body.isDefault) {
        await (supabase as any)
          .from('cancel_flows')
          .update({ is_default: false })
          .eq('organization_id', orgId)
          .neq('id', body.id);
      }

      // Build update data, only including defined values
      const updateData: Record<string, unknown> = {};

      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.is_active !== undefined || body.isActive !== undefined) {
        updateData.is_active = body.is_active ?? body.isActive;
      }
      if (body.is_default !== undefined || body.isDefault !== undefined) {
        updateData.is_default = body.is_default ?? body.isDefault;
      }
      if (body.target_type !== undefined || body.targetType !== undefined) {
        updateData.target_type = body.target_type ?? body.targetType;
      }
      if (body.target_product_ids !== undefined || body.targetProductIds !== undefined) {
        updateData.target_product_ids = body.target_product_ids ?? body.targetProductIds;
      }
      if (body.target_plan_ids !== undefined || body.targetPlanIds !== undefined) {
        updateData.target_plan_ids = body.target_plan_ids ?? body.targetPlanIds;
      }
      if (body.theme !== undefined) updateData.theme = body.theme;
      if (body.header_title !== undefined || body.headerTitle !== undefined) {
        updateData.header_title = body.header_title ?? body.headerTitle;
      }
      if (body.header_description !== undefined || body.headerDescription !== undefined) {
        updateData.header_description = body.header_description ?? body.headerDescription;
      }
      if (body.offer_title !== undefined || body.offerTitle !== undefined) {
        updateData.offer_title = body.offer_title ?? body.offerTitle;
      }
      if (body.offer_description !== undefined || body.offerDescription !== undefined) {
        updateData.offer_description = body.offer_description ?? body.offerDescription;
      }
      // Map feedback_options to reasons (database column name)
      if (body.reasons !== undefined || body.feedback_options !== undefined || body.feedbackOptions !== undefined) {
        updateData.reasons = body.reasons ?? body.feedback_options ?? body.feedbackOptions;
      }
      // Alternative plans for downgrade options
      if (body.alternative_plans !== undefined || body.alternativePlans !== undefined) {
        updateData.alternative_plans = body.alternative_plans ?? body.alternativePlans;
      }
      if (body.discount_percent !== undefined || body.discountPercent !== undefined) {
        // Clamp to valid range (5-90) to avoid constraint violations
        let discountPercent = body.discount_percent ?? body.discountPercent;
        discountPercent = Math.max(5, Math.min(90, Number(discountPercent) || 20));
        updateData.discount_percent = discountPercent;
      }
      if (body.discount_duration !== undefined || body.discountDuration !== undefined) {
        // Clamp to valid range (1-12) to avoid constraint violations
        let discountDuration = body.discount_duration ?? body.discountDuration;
        discountDuration = Math.max(1, Math.min(12, Number(discountDuration) || 3));
        updateData.discount_duration = discountDuration;
      }
      if (body.show_feedback !== undefined || body.showFeedback !== undefined) {
        updateData.show_feedback = body.show_feedback ?? body.showFeedback;
      }
      if (body.show_plans !== undefined || body.showPlans !== undefined) {
        updateData.show_plans = body.show_plans ?? body.showPlans;
      }
      if (body.show_offer !== undefined || body.showOffer !== undefined) {
        updateData.show_offer = body.show_offer ?? body.showOffer;
      }
      if (body.allow_other_option !== undefined || body.allowOtherOption !== undefined) {
        updateData.allow_other_option = body.allow_other_option ?? body.allowOtherOption;
      }
      // Copy settings (JSONB)
      if (body.feedback_copy !== undefined || body.feedbackCopy !== undefined) {
        updateData.feedback_copy = body.feedback_copy ?? body.feedbackCopy;
      }
      if (body.plans_copy !== undefined || body.plansCopy !== undefined) {
        updateData.plans_copy = body.plans_copy ?? body.plansCopy;
      }
      if (body.offer_copy !== undefined || body.offerCopy !== undefined) {
        updateData.offer_copy = body.offer_copy ?? body.offerCopy;
      }
      // Color settings (JSONB)
      if (body.feedback_colors !== undefined || body.feedbackColors !== undefined) {
        updateData.feedback_colors = body.feedback_colors ?? body.feedbackColors;
      }
      if (body.plans_colors !== undefined || body.plansColors !== undefined) {
        updateData.plans_colors = body.plans_colors ?? body.plansColors;
      }
      if (body.offer_colors !== undefined || body.offerColors !== undefined) {
        updateData.offer_colors = body.offer_colors ?? body.offerColors;
      }
      // Countdown settings
      if (body.show_countdown !== undefined || body.showCountdown !== undefined) {
        updateData.show_countdown = body.show_countdown ?? body.showCountdown;
      }
      if (body.countdown_minutes !== undefined || body.countdownMinutes !== undefined) {
        updateData.countdown_minutes = body.countdown_minutes ?? body.countdownMinutes;
      }

      console.log('Update data being sent:', JSON.stringify(updateData, null, 2));

      let flow;
      let error;

      // Try update with all fields first
      const result = await (supabase as any)
        .from('cancel_flows')
        .update(updateData)
        .eq('id', body.id)
        .eq('organization_id', orgId)
        .select()
        .single();

      flow = result.data;
      error = result.error;

      // If alternative_plans column not found in cache, retry without it
      if (error?.code === 'PGRST204' && error?.message?.includes('alternative_plans')) {
        console.log('Retrying without alternative_plans (schema cache not updated)');
        const retryData = { ...updateData };
        delete retryData.alternative_plans;

        const retryResult = await (supabase as any)
          .from('cancel_flows')
          .update(retryData)
          .eq('id', body.id)
          .eq('organization_id', orgId)
          .select()
          .single();

        flow = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        console.error('Supabase update error:', error);
        return NextResponse.json({ error: `Failed to update: ${error.message}` }, { status: 500 });
      }

      return NextResponse.json({ success: true, flow });
    } else {
      // Create new cancel flow
      // If setting as default, unset other defaults first
      if (body.is_default || body.isDefault) {
        await (supabase as any)
          .from('cancel_flows')
          .update({ is_default: false })
          .eq('organization_id', orgId);
      }

      // Clamp discount values to valid ranges
      let discountPercent = body.discount_percent ?? body.discountPercent ?? 20;
      discountPercent = Math.max(5, Math.min(90, Number(discountPercent) || 20));

      let discountDuration = body.discount_duration ?? body.discountDuration ?? 3;
      discountDuration = Math.max(1, Math.min(12, Number(discountDuration) || 3));

      const insertData = {
        organization_id: orgId,
        name: body.name,
        description: body.description || '',
        is_active: body.is_active ?? body.isActive ?? true,
        is_default: body.is_default ?? body.isDefault ?? false,
        target_type: body.target_type ?? body.targetType ?? 'all',
        target_product_ids: body.target_product_ids ?? body.targetProductIds ?? [],
        target_plan_ids: body.target_plan_ids ?? body.targetPlanIds ?? [],
        theme: body.theme || 'minimal',
        header_title: body.header_title ?? body.headerTitle ?? "We're sorry to see you go",
        header_description: body.header_description ?? body.headerDescription ?? "Before you go, please help us improve by sharing why you're canceling",
        offer_title: body.offer_title ?? body.offerTitle ?? "Wait! We have an offer for you",
        offer_description: body.offer_description ?? body.offerDescription ?? "",
        // Map feedback_options to reasons (database column name)
        reasons: body.reasons ?? body.feedback_options ?? body.feedbackOptions ?? DEFAULT_REASONS,
        // Alternative plans for downgrade options
        alternative_plans: body.alternative_plans ?? body.alternativePlans,
        discount_percent: discountPercent,
        discount_duration: discountDuration,
        show_feedback: body.show_feedback ?? body.showFeedback ?? true,
        show_plans: body.show_plans ?? body.showPlans ?? true,
        show_offer: body.show_offer ?? body.showOffer ?? true,
        allow_other_option: body.allow_other_option ?? body.allowOtherOption ?? true,
        // Copy settings (JSONB)
        feedback_copy: body.feedback_copy ?? body.feedbackCopy ?? { title: 'Sorry to see you go.', subtitle: "Please be honest about why you're leaving. It's the only way we can improve." },
        plans_copy: body.plans_copy ?? body.plansCopy ?? { title: "How about 80% off of one of our other plans? These aren't public.", subtitle: "You'd keep all your history and settings and enjoy much of the same functionality at a lower rate." },
        offer_copy: body.offer_copy ?? body.offerCopy ?? { title: "Stay to get {discount}% off for {duration}. We'd hate to lose you.", subtitle: "You're eligible for our special discount." },
        // Color settings (JSONB)
        feedback_colors: body.feedback_colors ?? body.feedbackColors ?? { primary: '#9333EA', background: '#F5F3FF', text: '#1F2937' },
        plans_colors: body.plans_colors ?? body.plansColors ?? { primary: '#2563EB', background: '#F0F4FF', text: '#1F2937' },
        offer_colors: body.offer_colors ?? body.offerColors ?? { primary: '#DC2626', background: '#FEF2F2', text: '#1F2937' },
        // Countdown settings
        show_countdown: body.show_countdown ?? body.showCountdown ?? true,
        countdown_minutes: body.countdown_minutes ?? body.countdownMinutes ?? 10,
      };

      console.log('Insert data being sent:', JSON.stringify(insertData, null, 2));

      let flow;
      let error;

      // Try insert with all fields first
      const result = await (supabase as any)
        .from('cancel_flows')
        .insert(insertData)
        .select()
        .single();

      flow = result.data;
      error = result.error;

      // If alternative_plans column not found in cache, retry without it
      if (error?.code === 'PGRST204' && error?.message?.includes('alternative_plans')) {
        console.log('Retrying insert without alternative_plans (schema cache not updated)');
        const retryData = { ...insertData };
        delete retryData.alternative_plans;

        const retryResult = await (supabase as any)
          .from('cancel_flows')
          .insert(retryData)
          .select()
          .single();

        flow = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        console.error('Supabase insert error:', error);
        return NextResponse.json({ error: `Failed to create: ${error.message}` }, { status: 500 });
      }

      return NextResponse.json({ success: true, flow });
    }
  } catch (error) {
    console.error('Cancel Flows POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save cancel flow' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a cancel flow
export async function DELETE(request: NextRequest) {
  try {
    const { supabase, orgId } = await getAuthenticatedClient();

    if (!orgId || !supabase) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Cancel flow ID required' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Check if it's the default flow
    const { data: flow } = await (supabase as any)
      .from('cancel_flows')
      .select('is_default')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (flow?.is_default) {
      return NextResponse.json({ error: 'Cannot delete the default cancel flow' }, { status: 400 });
    }

    const { error } = await (supabase as any)
      .from('cancel_flows')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: 'Failed to delete cancel flow' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel Flows DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete cancel flow' },
      { status: 500 }
    );
  }
}
