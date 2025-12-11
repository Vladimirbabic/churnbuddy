// =============================================================================
// Customer Discount API Route
// =============================================================================
// Apply or remove discounts from a customer's subscription

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

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

// Helper to get Stripe client from user's settings
async function getStripeClient(supabase: ReturnType<typeof createServerClient>, orgId: string): Promise<Stripe | null> {
  try {
    const { data: settings } = await supabase
      .from('settings')
      .select('stripe_config')
      .eq('organization_id', orgId)
      .single();

    const stripeConfig = settings?.stripe_config as Record<string, unknown> | null;
    const secretKey = stripeConfig?.secret_key as string | null;

    if (!secretKey) {
      return null;
    }

    return new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  } catch (error) {
    console.error('Failed to get Stripe client:', error);
    return null;
  }
}

// POST - Apply a discount to customer's subscription
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    const body = await request.json();
    const { discountType, discountValue, duration, durationInMonths } = body;

    // Validate input
    if (!discountType || discountValue === undefined || discountValue === null) {
      return NextResponse.json(
        { error: 'Discount type and value are required' },
        { status: 400 }
      );
    }

    if (discountType !== 'percent' && discountType !== 'amount') {
      return NextResponse.json(
        { error: 'Discount type must be "percent" or "amount"' },
        { status: 400 }
      );
    }

    if (discountType === 'percent' && (discountValue < 1 || discountValue > 100)) {
      return NextResponse.json(
        { error: 'Percent discount must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (discountType === 'amount' && discountValue < 0.01) {
      return NextResponse.json(
        { error: 'Amount discount must be at least $0.01' },
        { status: 400 }
      );
    }

    // Require authentication
    const { supabase, orgId } = await getAuthenticatedClient();
    if (!orgId || !supabase) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get Stripe client
    const stripe = await getStripeClient(supabase, orgId);
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not connected' },
        { status: 400 }
      );
    }

    // Get customer's active subscription
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['subscriptions'],
    });

    if (customer.deleted) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const subscriptions = (customer as Stripe.Customer).subscriptions?.data || [];
    const activeSubscription = subscriptions.find(s => s.status === 'active' || s.status === 'trialing');

    if (!activeSubscription) {
      return NextResponse.json(
        { error: 'Customer has no active subscription' },
        { status: 400 }
      );
    }

    // Get subscription currency for amount discounts
    const currency = activeSubscription.currency || 'usd';

    // Create a coupon first
    const couponParams: Stripe.CouponCreateParams = {
      duration: duration || 'once',
      name: `${discountType === 'percent' ? `${discountValue}%` : `$${discountValue}`} off`,
    };

    if (discountType === 'percent') {
      couponParams.percent_off = discountValue;
    } else {
      couponParams.amount_off = Math.round(discountValue * 100); // Convert to cents
      couponParams.currency = currency;
    }

    if (duration === 'repeating' && durationInMonths) {
      couponParams.duration_in_months = durationInMonths;
    }

    const coupon = await stripe.coupons.create(couponParams);

    // Apply the discount using the discounts array (works with flexible billing)
    const updatedSubscription = await stripe.subscriptions.update(activeSubscription.id, {
      discounts: [{ coupon: coupon.id }],
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
      },
      discount: {
        couponId: coupon.id,
        name: coupon.name || coupon.id,
        type: discountType,
        value: discountValue,
      },
    });
  } catch (error) {
    console.error('Apply discount error:', error);
    const stripeError = error as Stripe.errors.StripeError;
    return NextResponse.json(
      { error: stripeError.message || 'Failed to apply discount' },
      { status: 500 }
    );
  }
}

// DELETE - Remove discount from customer's subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;

    // Require authentication
    const { supabase, orgId } = await getAuthenticatedClient();
    if (!orgId || !supabase) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get Stripe client
    const stripe = await getStripeClient(supabase, orgId);
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not connected' },
        { status: 400 }
      );
    }

    // Get customer's active subscription
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['subscriptions'],
    });

    if (customer.deleted) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const subscriptions = (customer as Stripe.Customer).subscriptions?.data || [];
    const activeSubscription = subscriptions.find(s => s.status === 'active' || s.status === 'trialing');

    if (!activeSubscription) {
      return NextResponse.json(
        { error: 'Customer has no active subscription' },
        { status: 400 }
      );
    }

    // Remove the discount from the subscription
    await stripe.subscriptions.deleteDiscount(activeSubscription.id);

    return NextResponse.json({
      success: true,
      message: 'Discount removed successfully',
    });
  } catch (error) {
    console.error('Remove discount error:', error);
    const stripeError = error as Stripe.errors.StripeError;
    return NextResponse.json(
      { error: stripeError.message || 'Failed to remove discount' },
      { status: 500 }
    );
  }
}
