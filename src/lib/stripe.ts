// =============================================================================
// Stripe Configuration and Utilities
// =============================================================================
// Initializes the Stripe client and provides helper functions for common
// operations like creating billing portal sessions and applying discounts.

import Stripe from 'stripe';

// Default Stripe client using environment variable (for Exit Loop's own billing)
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      typescript: true,
    })
  : null as unknown as Stripe;

// Create a Stripe client for a specific organization using their API key
export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  });
}

// Get organization's Stripe key from settings
export async function getOrganizationStripeKey(flowId: string): Promise<string | null> {
  try {
    // Import supabase dynamically to avoid circular dependencies
    const { getServerSupabase, isSupabaseConfigured } = await import('@/lib/supabase');
    
    if (!isSupabaseConfigured()) {
      return null;
    }
    
    const supabase = getServerSupabase();
    
    // First, get the organization_id from the cancel_flows table
    const { data: flow, error: flowError } = await (supabase as any)
      .from('cancel_flows')
      .select('organization_id')
      .eq('id', flowId)
      .single();
    
    if (flowError || !flow) {
      console.error('Flow not found:', flowId);
      return null;
    }
    
    const orgId = (flow as { organization_id: string }).organization_id;
    
    // Then get the Stripe key from settings
    const { data: settings, error: settingsError } = await (supabase as any)
      .from('settings')
      .select('stripe_config')
      .eq('organization_id', orgId)
      .single();
    
    if (settingsError || !settings) {
      console.error('Settings not found for org:', orgId);
      return null;
    }
    
    const stripeConfig = (settings as { stripe_config?: { secret_key?: string } }).stripe_config;
    return stripeConfig?.secret_key || null;
  } catch (error) {
    console.error('Error fetching organization Stripe key:', error);
    return null;
  }
}

/**
 * Create a Stripe Billing Portal session for a customer
 * Allows customers to update payment methods, view invoices, etc.
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Get customer details from Stripe
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return customer as Stripe.Customer;
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Get the active discount on a subscription (if any)
 * Used to check if customer already has a discount before applying a new one
 */
export async function getSubscriptionDiscount(subscriptionId: string): Promise<Stripe.Discount | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription.discount;
  } catch (error) {
    console.error('Error fetching subscription discount:', error);
    return null;
  }
}

/**
 * Apply a discount coupon to a subscription
 * Used when a customer accepts a save offer
 */
export async function applyDiscountToSubscription(
  subscriptionId: string,
  couponId: string
): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.update(subscriptionId, {
      coupon: couponId,
    });
  } catch (error) {
    console.error('Error applying discount:', error);
    return null;
  }
}

/**
 * Create a discount coupon in Stripe
 * Can be used to dynamically create save offers
 */
export async function createDiscountCoupon(
  percentOff: number,
  durationInMonths: number,
  name?: string
): Promise<Stripe.Coupon | null> {
  try {
    return await stripe.coupons.create({
      percent_off: percentOff,
      duration: 'repeating',
      duration_in_months: durationInMonths,
      name: name || `Save Offer - ${percentOff}% off for ${durationInMonths} months`,
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return null;
  }
}

/**
 * Cancel a subscription immediately or at period end
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription | null> {
  try {
    if (cancelAtPeriodEnd) {
      // Cancel at the end of the current billing period
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      // Cancel immediately
      return await stripe.subscriptions.cancel(subscriptionId);
    }
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return null;
  }
}

/**
 * Reactivate a subscription that was set to cancel at period end
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return null;
  }
}

/**
 * Get the hosted invoice URL for a customer to pay
 */
export async function getHostedInvoiceUrl(invoiceId: string): Promise<string | null> {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    return invoice.hosted_invoice_url ?? null;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
}

/**
 * Get human-readable decline reason from Stripe error code
 */
export function getDeclineReason(declineCode?: string | null): string {
  const reasons: Record<string, string> = {
    'insufficient_funds': 'Your card has insufficient funds.',
    'lost_card': 'This card has been reported as lost.',
    'stolen_card': 'This card has been reported as stolen.',
    'expired_card': 'Your card has expired.',
    'incorrect_cvc': 'The security code (CVC) is incorrect.',
    'processing_error': 'There was a processing error. Please try again.',
    'incorrect_number': 'The card number is incorrect.',
    'card_declined': 'Your card was declined.',
    'authentication_required': 'Authentication is required for this payment.',
    'try_again_later': 'Please try again later.',
  };

  return reasons[declineCode || ''] || 'Your payment could not be processed. Please update your payment method.';
}

// =============================================================================
// Products & Prices Functions
// =============================================================================

export interface StripePrice {
  id: string;
  productId: string;
  productName: string;
  unitAmount: number; // in cents
  currency: string;
  interval: 'month' | 'year' | 'week' | 'day' | null;
  intervalCount: number;
  active: boolean;
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  prices: StripePrice[];
}

/**
 * Get all active products and their prices from Stripe
 * Used for the alternative plans picker in cancel flow editor
 */
export async function getProductsAndPrices(stripeClient: Stripe): Promise<StripeProduct[]> {
  try {
    // Fetch all active products
    const products = await stripeClient.products.list({
      active: true,
      limit: 100,
    });

    // Fetch all active prices
    const prices = await stripeClient.prices.list({
      active: true,
      limit: 100,
      expand: ['data.product'],
    });

    // Group prices by product
    const productMap = new Map<string, StripeProduct>();

    for (const product of products.data) {
      productMap.set(product.id, {
        id: product.id,
        name: product.name,
        description: product.description,
        active: product.active,
        prices: [],
      });
    }

    // Add prices to their products
    for (const price of prices.data) {
      const productId = typeof price.product === 'string' ? price.product : price.product.id;
      const product = productMap.get(productId);

      if (product && price.unit_amount !== null) {
        product.prices.push({
          id: price.id,
          productId: productId,
          productName: product.name,
          unitAmount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval || null,
          intervalCount: price.recurring?.interval_count || 1,
          active: price.active,
        });
      }
    }

    // Return products that have prices, sorted by name
    return Array.from(productMap.values())
      .filter(p => p.prices.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching products and prices:', error);
    throw error;
  }
}

/**
 * Get or create a coupon for a specific discount percentage and duration
 * Reuses existing coupons if they match the parameters
 */
export async function getOrCreateCoupon(
  stripeClient: Stripe,
  percentOff: number,
  durationInMonths: number
): Promise<string> {
  const couponName = `Plan Switch - ${percentOff}% off for ${durationInMonths} months`;

  try {
    // Try to find existing coupon
    const coupons = await stripeClient.coupons.list({ limit: 100 });
    const existingCoupon = coupons.data.find(
      c => c.percent_off === percentOff &&
           c.duration === 'repeating' &&
           c.duration_in_months === durationInMonths &&
           c.valid
    );

    if (existingCoupon) {
      return existingCoupon.id;
    }

    // Create new coupon
    const newCoupon = await stripeClient.coupons.create({
      percent_off: percentOff,
      duration: 'repeating',
      duration_in_months: durationInMonths,
      name: couponName,
    });

    return newCoupon.id;
  } catch (error) {
    console.error('Error getting/creating coupon:', error);
    throw error;
  }
}

/**
 * Switch a subscription to a new price with an optional discount
 * This handles the plan change immediately with proration
 */
export async function switchSubscriptionPlan(
  stripeClient: Stripe,
  subscriptionId: string,
  newPriceId: string,
  discountPercent?: number,
  discountDurationMonths?: number
): Promise<{ success: boolean; subscription?: Stripe.Subscription; error?: string }> {
  try {
    // Get current subscription to find the subscription item
    const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);

    if (!subscription || subscription.status === 'canceled') {
      return { success: false, error: 'Subscription not found or already canceled' };
    }

    // Get the first subscription item (most subscriptions have one item)
    const subscriptionItem = subscription.items.data[0];
    if (!subscriptionItem) {
      return { success: false, error: 'No subscription items found' };
    }

    // Check if already on this price
    if (subscriptionItem.price.id === newPriceId) {
      return { success: false, error: 'Already subscribed to this plan' };
    }

    // Prepare update params
    const updateParams: Stripe.SubscriptionUpdateParams = {
      items: [{
        id: subscriptionItem.id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
      // Remove cancel_at_period_end if it was set
      cancel_at_period_end: false,
    };

    // Apply discount if specified
    if (discountPercent && discountPercent > 0 && discountDurationMonths) {
      const couponId = await getOrCreateCoupon(stripeClient, discountPercent, discountDurationMonths);
      updateParams.coupon = couponId;
    }

    // Update the subscription
    const updatedSubscription = await stripeClient.subscriptions.update(subscriptionId, updateParams);

    return { success: true, subscription: updatedSubscription };
  } catch (error) {
    console.error('Error switching subscription plan:', error);
    // Handle Stripe errors specifically
    let message = 'Failed to switch plan';
    if (error && typeof error === 'object') {
      // Stripe errors have a 'message' property
      if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
        message = (error as { message: string }).message;
      }
      // Also check for raw property which sometimes contains the actual error
      if ('raw' in error && typeof error.raw === 'object' && error.raw && 'message' in error.raw) {
        message = (error.raw as { message: string }).message;
      }
    }
    return { success: false, error: message };
  }
}
