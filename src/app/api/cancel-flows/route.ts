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

// GET: Retrieve all cancel flows
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
      // Get single cancel flow
      const { data: flow, error } = await (supabase as any)
        .from('cancel_flows')
        .select('*')
        .eq('id', id)
        .eq('organization_id', orgId)
        .single();

      if (error || !flow) {
        return NextResponse.json({ error: 'Cancel flow not found' }, { status: 404 });
      }

      return NextResponse.json({ flow });
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

    return NextResponse.json({ flows: flows || [] });
  } catch (error) {
    console.error('Cancel Flows GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cancel flows' },
      { status: 500 }
    );
  }
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

      const updateData = {
        name: body.name,
        description: body.description,
        is_active: body.is_active ?? body.isActive,
        is_default: body.is_default ?? body.isDefault,
        target_type: body.target_type ?? body.targetType,
        target_product_ids: body.target_product_ids ?? body.targetProductIds,
        target_plan_ids: body.target_plan_ids ?? body.targetPlanIds,
        theme: body.theme,
        header_title: body.header_title ?? body.headerTitle,
        header_description: body.header_description ?? body.headerDescription,
        offer_title: body.offer_title ?? body.offerTitle,
        offer_description: body.offer_description ?? body.offerDescription,
        // Map feedback_options to reasons (database column name)
        reasons: body.reasons ?? body.feedback_options ?? body.feedbackOptions,
        discount_percent: body.discount_percent ?? body.discountPercent,
        discount_duration: body.discount_duration ?? body.discountDuration,
        show_offer: body.show_offer ?? body.showOffer,
      };

      const { data: flow, error } = await (supabase as any)
        .from('cancel_flows')
        .update(updateData)
        .eq('id', body.id)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        return NextResponse.json({ error: 'Failed to update cancel flow' }, { status: 500 });
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
        discount_percent: body.discount_percent ?? body.discountPercent ?? 20,
        discount_duration: body.discount_duration ?? body.discountDuration ?? 3,
        show_offer: body.show_offer ?? body.showOffer ?? true,
      };

      const { data: flow, error } = await (supabase as any)
        .from('cancel_flows')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return NextResponse.json({ error: 'Failed to create cancel flow' }, { status: 500 });
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
