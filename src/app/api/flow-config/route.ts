// =============================================================================
// Public Flow Configuration API
// =============================================================================
// Returns cancel flow configuration for the embed script (no auth required)

import { NextRequest, NextResponse } from 'next/server';
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

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
  const corsHeaders = getCorsHeaders(request);

  // Rate limiting
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`flow-config:${clientIp}`, RATE_LIMITS.public);
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
    // Get copy settings from individual columns (new) or legacy copy column (old)
    const legacyCopy = flow.copy || {};
    const feedbackCopy = flow.feedback_copy || {};
    const plansCopy = flow.plans_copy || {};
    const offerCopy = flow.offer_copy || {};

    // Get color settings from individual columns
    const feedbackColors = flow.feedback_colors || { primary: '#9333EA', background: '#F5F3FF', text: '#1F2937' };
    const plansColors = flow.plans_colors || { primary: '#2563EB', background: '#F0F4FF', text: '#1F2937' };
    const offerColors = flow.offer_colors || { primary: '#DC2626', background: '#FEF2F2', text: '#1F2937' };

    const config = {
      feedbackOptions: flow.reasons || DEFAULT_FEEDBACK_OPTIONS,
      alternativePlans: flow.alternative_plans || DEFAULT_PLANS,
      discountPercent: flow.discount_percent || 20,
      discountDuration: flow.discount_duration || 3,
      showFeedback: flow.show_feedback ?? true,
      showPlans: flow.show_plans ?? true,
      showOffer: flow.show_offer ?? true,
      // Allow "Other" option with text input
      allowOtherOption: flow.allow_other_option ?? true,
      // Countdown settings
      showCountdown: flow.show_countdown ?? true,
      countdownMinutes: flow.countdown_minutes ?? 10,
      // Color settings for each step
      feedbackColors,
      plansColors,
      offerColors,
      // Customizable copy for each step (prefer new columns, fallback to legacy)
      copy: {
        // Feedback step
        feedbackTitle: feedbackCopy.title || legacyCopy.feedbackTitle || "Sorry to see you go.",
        feedbackSubtitle: feedbackCopy.subtitle || legacyCopy.feedbackSubtitle || "Please be honest about why you're leaving. It's the only way we can improve.",
        feedbackBackButton: legacyCopy.feedbackBackButton || "Back",
        feedbackNextButton: legacyCopy.feedbackNextButton || "Next",
        // Plans step
        plansTitle: plansCopy.title || legacyCopy.plansTitle || "How about 80% off of one of our other plans? These aren't public.",
        plansSubtitle: plansCopy.subtitle || legacyCopy.plansSubtitle || "You'd keep all your history and settings and enjoy much of the same functionality at a lower rate.",
        plansBackButton: legacyCopy.plansBackButton || "Back",
        plansDeclineButton: legacyCopy.plansDeclineButton || "Decline Offer",
        // Offer step
        offerTitle: offerCopy.title || legacyCopy.offerTitle || "Stay to get {discount}% off for {duration} months. We'd hate to lose you.",
        offerSubtitle: offerCopy.subtitle || legacyCopy.offerSubtitle || "You're eligible for our special discount.",
        offerTimerLabel: legacyCopy.offerTimerLabel || "Offer expires in",
        offerBadgeText: legacyCopy.offerBadgeText || "Time-Limited Deal",
        offerDiscountText: legacyCopy.offerDiscountText || "{discount}% off for {duration} months",
        offerAcceptButton: legacyCopy.offerAcceptButton || "Accept This Offer",
        offerBackButton: legacyCopy.offerBackButton || "Back",
        offerDeclineButton: legacyCopy.offerDeclineButton || "Decline Offer",
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
export async function OPTIONS(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  return new NextResponse(null, { headers: corsHeaders });
}
