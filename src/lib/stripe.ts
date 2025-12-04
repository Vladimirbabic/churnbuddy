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
