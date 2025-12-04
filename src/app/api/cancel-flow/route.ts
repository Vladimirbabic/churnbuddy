// =============================================================================
// Cancel Flow API Route
// =============================================================================
// Handles logging of cancel flow events from the CancelFlowModal component.
// Also provides endpoints for applying discounts when users accept save offers.
// Uses Supabase for data persistence.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';

const DEFAULT_ORG_ID = 'demo-org-001';

// CORS headers for cross-origin requests from embed script
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Lazy load Stripe utilities only when needed
// If flowId is provided, uses the organization's Stripe key from settings
async function getStripeUtils(flowId?: string) {
  try {
    const { stripe, createStripeClient, getOrganizationStripeKey, getSubscriptionDiscount } = await import('@/lib/stripe');
    
    // If flowId provided, try to get organization's Stripe key
    let stripeClient = stripe;
    if (flowId) {
      const orgStripeKey = await getOrganizationStripeKey(flowId);
      if (orgStripeKey) {
        console.log('Using organization Stripe key for flow:', flowId);
        stripeClient = createStripeClient(orgStripeKey);
      } else {
        console.log('No organization Stripe key found, using default');
      }
    }
    
    // Create functions that use the correct Stripe client
    const applyDiscountToSubscription = async (subscriptionId: string, couponId: string) => {
      try {
        return await stripeClient.subscriptions.update(subscriptionId, { coupon: couponId });
      } catch (error) {
        console.error('Error applying discount:', error);
        return null;
      }
    };
    
    const createDiscountCoupon = async (percentOff: number, durationInMonths: number, name?: string) => {
      try {
        return await stripeClient.coupons.create({
          percent_off: percentOff,
          duration: 'repeating',
          duration_in_months: durationInMonths,
          name: name || `Save Offer - ${percentOff}% off for ${durationInMonths} months`,
        });
      } catch (error) {
        console.error('Error creating coupon:', error);
        return null;
      }
    };
    
    const getSubscriptionDiscountFn = async (subscriptionId: string) => {
      try {
        const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
        return subscription.discount;
      } catch (error) {
        console.error('Error fetching subscription discount:', error);
        return null;
      }
    };
    
    return { 
      stripe: stripeClient, 
      applyDiscountToSubscription, 
      createDiscountCoupon, 
      getSubscriptionDiscount: getSubscriptionDiscountFn 
    };
  } catch (error) {
    console.warn('Stripe not configured:', error);
    return null;
  }
}

// Look up Stripe customer by email and get their active subscription
async function lookupCustomerByEmail(email: string, flowId?: string) {
  const stripeUtils = await getStripeUtils(flowId);
  if (!stripeUtils) {
    return { customerId: null, subscriptionId: null, error: 'Stripe not configured' };
  }

  try {
    // Search for customer by email
    const customers = await stripeUtils.stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return { customerId: null, subscriptionId: null, error: 'No customer found with this email' };
    }

    const customer = customers.data[0];
    
    // Get the customer's active subscription
    const subscriptions = await stripeUtils.stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    // If no active subscription, check for trialing
    let subscription = subscriptions.data[0];
    if (!subscription) {
      const trialingSubscriptions = await stripeUtils.stripe.subscriptions.list({
        customer: customer.id,
        status: 'trialing',
        limit: 1,
      });
      subscription = trialingSubscriptions.data[0];
    }

    return {
      customerId: customer.id,
      subscriptionId: subscription?.id || null,
      customerEmail: customer.email,
      error: subscription ? null : 'No active subscription found',
    };
  } catch (err) {
    console.error('Error looking up customer by email:', err);
    return { customerId: null, subscriptionId: null, error: 'Failed to lookup customer' };
  }
}

// Lazy load email utilities only when needed
async function getEmailUtils() {
  try {
    const { sendSaveOfferAcceptedEmail } = await import('@/lib/email');
    return { sendSaveOfferAcceptedEmail };
  } catch (error) {
    console.warn('Email service not configured:', error);
    return null;
  }
}

// POST: Log cancel flow events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { eventType, customerId, subscriptionId, details, flowId } = body;
    const { customerEmail: inputEmail } = body;

    // If email is provided instead of customerId, look up the customer
    let customerEmail: string | undefined = inputEmail;
    
    if (!customerId && inputEmail) {
      const lookup = await lookupCustomerByEmail(inputEmail, flowId);
      if (lookup.customerId) {
        customerId = lookup.customerId;
        subscriptionId = subscriptionId || lookup.subscriptionId;
        customerEmail = lookup.customerEmail || inputEmail;
      } else {
        // Log the event anyway with email as identifier
        customerId = `email:${inputEmail}`;
        console.warn('Customer lookup failed:', lookup.error);
      }
    }

    if (!eventType || (!customerId && !inputEmail)) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType and (customerId or customerEmail)' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get Stripe utils - uses organization's Stripe key if flowId provided
    const stripeUtils = await getStripeUtils(flowId);

    if (!customerEmail && stripeUtils && customerId && !customerId.startsWith('email:')) {
      try {
        const customer = await stripeUtils.stripe.customers.retrieve(customerId);
        if (!customer.deleted) {
          customerEmail = customer.email || undefined;
        }
      } catch (err) {
        console.error('Failed to fetch customer:', err);
      }
    }

    // Create the event record
    let eventId: string | undefined;

    if (isSupabaseConfigured()) {
      const supabase = getServerSupabase();

      const { data: event, error } = await (supabase as any)
        .from('churn_events')
        .insert({
          organization_id: DEFAULT_ORG_ID,
          event_type: eventType,
          timestamp: new Date().toISOString(),
          customer_id: customerId,
          customer_email: customerEmail,
          subscription_id: subscriptionId,
          details: {
            cancellation_reason: details?.reason,
            cancellation_feedback: details?.feedback,
            discount_offered: details?.discountPercent,
            discount_accepted: eventType === 'offer_accepted',
          },
          source: 'cancel_flow',
          processed: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
      } else {
        eventId = event?.id;
      }
    }

    // If offer was accepted, apply the discount to the subscription
    if (eventType === 'offer_accepted') {
      // Check if we have required data for discount application
      if (!subscriptionId) {
        return NextResponse.json({
          success: false,
          error: 'missing_subscription',
          message: 'No subscription ID provided. Cannot apply discount.',
          eventId,
        }, { headers: corsHeaders });
      }

      if (!stripeUtils) {
        return NextResponse.json({
          success: false,
          error: 'stripe_not_configured',
          message: 'Stripe is not configured. Please set up your Stripe API keys.',
          eventId,
        }, { headers: corsHeaders });
      }

      const discountPercent = details?.discountPercent || 20;
      const durationInMonths = parseInt(details?.discountDuration) || 3;

      try {
        // Check if subscription already has an active discount
        const existingDiscount = await stripeUtils.getSubscriptionDiscount(subscriptionId);
        if (existingDiscount) {
          return NextResponse.json({
            success: false,
            error: 'already_has_discount',
            message: 'This subscription already has an active discount',
            existingDiscount: {
              percentOff: existingDiscount.coupon?.percent_off,
              amountOff: existingDiscount.coupon?.amount_off,
              name: existingDiscount.coupon?.name,
              endsAt: existingDiscount.end ? new Date(existingDiscount.end * 1000).toISOString() : null,
            },
            eventId,
          }, { headers: corsHeaders });
        }

        // Create a coupon for this offer
        const coupon = await stripeUtils.createDiscountCoupon(
          discountPercent,
          durationInMonths,
          `Retention Offer - ${customerId}`
        );

        if (!coupon) {
          return NextResponse.json({
            success: false,
            error: 'coupon_creation_failed',
            message: 'Failed to create discount coupon. Please try again.',
            eventId,
          }, { headers: corsHeaders });
        }

        // Apply the coupon to the subscription
        const updatedSubscription = await stripeUtils.applyDiscountToSubscription(subscriptionId, coupon.id);

        if (!updatedSubscription) {
          return NextResponse.json({
            success: false,
            error: 'discount_application_failed',
            message: 'Failed to apply discount to subscription. The subscription may not exist or is invalid.',
            eventId,
          }, { headers: corsHeaders });
        }

        // Send confirmation email
        const emailUtils = await getEmailUtils();
        if (customerEmail && emailUtils) {
          await emailUtils.sendSaveOfferAcceptedEmail({
            customerEmail,
            discountPercent,
            discountDuration: `${durationInMonths} months`,
          });
        }

        // Update the event with processing details
        if (eventId && isSupabaseConfigured()) {
          const supabase = getServerSupabase();
          await (supabase as any)
            .from('churn_events')
            .update({
              details: {
                cancellation_reason: details?.reason,
                cancellation_feedback: details?.feedback,
                discount_offered: details?.discountPercent,
                discount_accepted: true,
                discount_applied: true,
              },
            })
            .eq('id', eventId);
        }

        // Return success with discount details
        return NextResponse.json({
          success: true,
          discountApplied: true,
          discount: {
            percentOff: discountPercent,
            durationMonths: durationInMonths,
            couponId: coupon.id,
          },
          eventId,
        }, { headers: corsHeaders });

      } catch (err: unknown) {
        console.error('Failed to apply discount:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        return NextResponse.json({
          success: false,
          error: 'discount_error',
          message: `Failed to apply discount: ${errorMessage}`,
          eventId,
        }, { headers: corsHeaders });
      }
    }

    return NextResponse.json({
      success: true,
      eventId,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Cancel flow API error:', error);
    return NextResponse.json(
      { error: 'Failed to process cancel flow event' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET: Get cancel flow stats for a customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const flowId = searchParams.get('flowId') || undefined;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing customerId parameter' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        events: [],
        hasActiveDiscount: false,
        totalAttempts: 0,
        savedCount: 0,
        demoMode: true,
      }, { headers: corsHeaders });
    }

    const supabase = getServerSupabase();

    // Get all cancel flow events for this customer
    const { data: events, error } = await (supabase as any)
      .from('churn_events')
      .select('*')
      .eq('customer_id', customerId)
      .eq('source', 'cancel_flow')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Supabase error:', error);
    }

    // Check if customer has an active discount
    let hasActiveDiscount = false;
    const stripeUtils = await getStripeUtils(flowId);

    if (stripeUtils) {
      try {
        const subscriptions = await stripeUtils.stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const sub = subscriptions.data[0];
          hasActiveDiscount = !!sub.discount;
        }
      } catch (err) {
        console.error('Failed to check discount status:', err);
      }
    }

    const eventsList = events || [];

    return NextResponse.json({
      events: eventsList,
      hasActiveDiscount,
      totalAttempts: eventsList.filter((e: { event_type: string }) => e.event_type === 'cancellation_attempt').length,
      savedCount: eventsList.filter((e: { event_type: string }) => e.event_type === 'offer_accepted').length,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Cancel flow GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cancel flow data' },
      { status: 500, headers: corsHeaders }
    );
  }
}
