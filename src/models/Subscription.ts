// =============================================================================
// Subscription Types and Constants
// =============================================================================
// TypeScript types and plan configuration for subscriptions

export interface SubscriptionData {
  organizationId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  plan: 'starter' | 'growth' | 'scale';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  cancelFlowsLimit: number; // 1, 5, or -1 for unlimited
  cancelFlowsUsed: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Plan configuration - matches Stripe products
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 900, // $9 in cents
    priceId: process.env.STRIPE_PRICE_STARTER || 'price_1SaZfrLXgHZdEVXGEoy3Zuzb',
    cancelFlowsLimit: 1,
    features: ['1 Cancel Flow', 'Basic analytics', 'Email support'],
  },
  growth: {
    name: 'Growth',
    price: 1900, // $19 in cents
    priceId: process.env.STRIPE_PRICE_GROWTH || 'price_1SaZg5LXgHZdEVXGLCk6Um6u',
    cancelFlowsLimit: 5,
    features: ['5 Cancel Flows', 'Advanced analytics', 'Priority support', 'Custom branding'],
  },
  scale: {
    name: 'Scale',
    price: 4900, // $49 in cents (add later if needed)
    priceId: process.env.STRIPE_PRICE_SCALE || 'price_1SaZg5LXgHZdEVXGLCk6Um6u', // Using growth as fallback for now
    cancelFlowsLimit: -1, // unlimited
    features: ['Unlimited Cancel Flows', 'Advanced analytics', 'Priority support', 'Custom branding', 'API access'],
  },
} as const;

export type PlanType = keyof typeof PLANS;
