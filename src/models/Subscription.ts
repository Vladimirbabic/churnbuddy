// =============================================================================
// Subscription Types and Constants
// =============================================================================
// TypeScript types and plan configuration for subscriptions

export interface SubscriptionData {
  organizationId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  plan: 'basic' | 'growth' | 'scale';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  cancelFlowsLimit: number; // 1, 5, or -1 for unlimited
  cancelFlowsUsed: number;
  emailSequencesEnabled: boolean;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Plan configuration
export const PLANS = {
  basic: {
    name: 'Basic',
    price: 900, // in cents
    priceId: process.env.STRIPE_PRICE_BASIC || 'price_basic',
    cancelFlowsLimit: 1,
    emailSequencesEnabled: false,
    features: ['1 Cancel Flow', 'Analytics', 'Email support'],
  },
  growth: {
    name: 'Growth',
    price: 1900,
    priceId: process.env.STRIPE_PRICE_GROWTH || 'price_growth',
    cancelFlowsLimit: 5,
    emailSequencesEnabled: true,
    features: ['5 Cancel Flows', 'Email Sequences', 'Analytics', 'Priority support'],
  },
  scale: {
    name: 'Scale',
    price: 4900,
    priceId: process.env.STRIPE_PRICE_SCALE || 'price_scale',
    cancelFlowsLimit: -1, // unlimited
    emailSequencesEnabled: true,
    features: ['Unlimited Cancel Flows', 'Email Sequences', 'Analytics', 'Priority support', 'API access'],
  },
} as const;

export type PlanType = keyof typeof PLANS;
