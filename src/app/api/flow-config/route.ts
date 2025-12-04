// =============================================================================
// Public Flow Configuration API
// =============================================================================
// Returns cancel flow configuration for the embed script (no auth required)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';

// Default feedback options
const DEFAULT_FEEDBACK_OPTIONS = [
  { id: 'too_expensive', label: 'Too expensive', letter: 'A' },
  { id: 'not_using', label: 'Not using it enough', letter: 'B' },
  { id: 'missing_features', label: 'Missing features I need', letter: 'C' },
  { id: 'found_alternative', label: 'Found a better alternative', letter: 'D' },
  { id: 'other', label: 'Other reason', letter: 'E' },
];

// Default alternative plans
const DEFAULT_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    originalPrice: 29,
    discountedPrice: 5.80,
    period: '/mo',
    highlights: ['5 projects', 'Basic analytics', 'Email support', '1GB storage'],
  },
  {
    id: 'pro',
    name: 'Pro',
    originalPrice: 79,
    discountedPrice: 15.80,
    period: '/mo',
    highlights: ['25 projects', 'Advanced analytics', 'Priority support', '10GB storage'],
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const flowId = searchParams.get('id');

  // CORS headers for cross-origin requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!flowId) {
    return NextResponse.json(
      { error: 'Flow ID required' },
      { status: 400, headers: corsHeaders }
    );
  }

  if (!isSupabaseConfigured()) {
    // Return default config for demo/development
    return NextResponse.json({
      feedbackOptions: DEFAULT_FEEDBACK_OPTIONS,
      alternativePlans: DEFAULT_PLANS,
      discountPercent: 20,
      discountDuration: 3,
      showFeedback: true,
      showPlans: true,
      showOffer: true,
      headerTitle: "We're sorry to see you go",
      headerDescription: "Before you go, please help us improve by sharing why you're canceling",
    }, { headers: corsHeaders });
  }

  try {
    const supabase = getServerSupabase();

    // Log whether we have admin access
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('Flow config request:', { flowId, hasServiceKey });

    const { data: flow, error } = await (supabase as any)
      .from('cancel_flows')
      .select('*')
      .eq('id', flowId)
      .single();

    if (error) {
      console.error('Flow config DB error:', error);
      return NextResponse.json(
        { error: 'Flow not found', details: error.message, hint: hasServiceKey ? undefined : 'SUPABASE_SERVICE_ROLE_KEY not configured - RLS may be blocking access' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (!flow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Map database fields to API response
    // All copy can be customized by the user in the flow editor
    const copy = flow.copy || {};
    const config = {
      feedbackOptions: flow.reasons || DEFAULT_FEEDBACK_OPTIONS,
      alternativePlans: flow.alternative_plans || DEFAULT_PLANS,
      discountPercent: flow.discount_percent || 20,
      discountDuration: flow.discount_duration || 3,
      showFeedback: flow.show_feedback ?? true,
      showPlans: flow.show_plans ?? true,
      showOffer: flow.show_offer ?? true,
      // Customizable copy for each step
      copy: {
        // Feedback step
        feedbackTitle: copy.feedbackTitle || "Sorry to see you go.",
        feedbackSubtitle: copy.feedbackSubtitle || "Please be honest about why you're leaving. It's the only way we can improve.",
        feedbackBackButton: copy.feedbackBackButton || "Back",
        feedbackNextButton: copy.feedbackNextButton || "Next",
        // Plans step
        plansTitle: copy.plansTitle || "How about 80% off of one of our other plans? These aren't public.",
        plansSubtitle: copy.plansSubtitle || "You'd keep all your history and settings and enjoy much of the same functionality at a lower rate.",
        plansBackButton: copy.plansBackButton || "Back",
        plansDeclineButton: copy.plansDeclineButton || "Decline Offer",
        // Offer step
        offerTitle: copy.offerTitle || "Stay to get {discount}% off for {duration} months. We'd hate to lose you.",
        offerSubtitle: copy.offerSubtitle || "You're eligible for our special discount.",
        offerTimerLabel: copy.offerTimerLabel || "Offer expires in",
        offerBadgeText: copy.offerBadgeText || "Time-Limited Deal",
        offerDiscountText: copy.offerDiscountText || "{discount}% off for {duration} months",
        offerAcceptButton: copy.offerAcceptButton || "Accept This Offer",
        offerBackButton: copy.offerBackButton || "Back",
        offerDeclineButton: copy.offerDeclineButton || "Decline Offer",
      },
      // Deprecated fields (kept for backwards compatibility)
      headerTitle: flow.header_title || "We're sorry to see you go",
      headerDescription: flow.header_description || "Before you go, please help us improve by sharing why you're canceling",
      offerTitle: flow.offer_title || "Wait! We have an offer for you",
      offerDescription: flow.offer_description || "",
    };

    return NextResponse.json(config, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      }
    });
  } catch (error) {
    console.error('Flow config error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flow config' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
