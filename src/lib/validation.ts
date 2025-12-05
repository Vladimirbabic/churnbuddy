// =============================================================================
// Input Validation Schemas
// =============================================================================
// Zod schemas for validating API inputs to prevent injection attacks

import { z } from 'zod';

// Email validation with length limits
export const emailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .transform(val => val.toLowerCase().trim());

// Customer ID validation (Stripe format: cus_xxx)
export const customerIdSchema = z.string()
  .min(1, 'Customer ID required')
  .max(255, 'Customer ID too long')
  .regex(/^(cus_[a-zA-Z0-9]+|email:.+)$/, 'Invalid customer ID format');

// Subscription ID validation (Stripe format: sub_xxx)
export const subscriptionIdSchema = z.string()
  .min(1, 'Subscription ID required')
  .max(255, 'Subscription ID too long')
  .regex(/^sub_[a-zA-Z0-9]+$/, 'Invalid subscription ID format');

// Flow ID validation (UUID format)
export const flowIdSchema = z.string()
  .uuid('Invalid flow ID format');

// Price ID validation (Stripe format: price_xxx)
export const priceIdSchema = z.string()
  .min(1, 'Price ID required')
  .max(255, 'Price ID too long')
  .regex(/^price_[a-zA-Z0-9]+$/, 'Invalid price ID format');

// Event type validation
export const eventTypeSchema = z.enum([
  'cancellation_attempt',
  'reason_selected',
  'offer_shown',
  'offer_accepted',
  'offer_declined',
  'plan_switched',
  'cancelled',
  'flow_completed',
], { message: 'Invalid event type' });

// Cancel reason validation
export const cancelReasonSchema = z.string()
  .max(5000, 'Reason text too long')
  .optional();

// Discount percent validation
export const discountPercentSchema = z.number()
  .int('Discount must be a whole number')
  .min(1, 'Discount must be at least 1%')
  .max(100, 'Discount cannot exceed 100%');

// Discount duration validation (months)
export const discountDurationSchema = z.number()
  .int('Duration must be a whole number')
  .min(1, 'Duration must be at least 1 month')
  .max(36, 'Duration cannot exceed 36 months');

// Cancel flow event details
export const cancelFlowDetailsSchema = z.object({
  reason: cancelReasonSchema,
  otherText: z.string().max(5000, 'Feedback too long').optional(),
  feedback: z.string().max(5000, 'Feedback too long').optional(),
  discountPercent: discountPercentSchema.optional(),
  discountDuration: z.union([
    z.string().transform(val => parseInt(val, 10)),
    z.number()
  ]).pipe(discountDurationSchema).optional(),
}).optional();

// Cancel flow POST request body
export const cancelFlowRequestSchema = z.object({
  eventType: eventTypeSchema,
  customerId: customerIdSchema.optional(),
  customerEmail: emailSchema.optional(),
  subscriptionId: subscriptionIdSchema.optional(),
  flowId: flowIdSchema,
  details: cancelFlowDetailsSchema,
}).refine(
  data => data.customerId || data.customerEmail,
  { message: 'Either customerId or customerEmail is required' }
);

// Switch plan request body
export const switchPlanRequestSchema = z.object({
  flowId: flowIdSchema,
  subscriptionId: subscriptionIdSchema,
  newPriceId: priceIdSchema,
  customerId: customerIdSchema.optional(),
  customerEmail: emailSchema.optional(),
  planName: z.string().max(100, 'Plan name too long').optional(),
  discountPercent: discountPercentSchema.optional(),
  discountDurationMonths: discountDurationSchema.optional().default(3),
});

// Settings Stripe config
export const stripeConfigSchema = z.object({
  testMode: z.boolean().optional(),
  secretKey: z.string().max(500).optional(),
  webhookSecret: z.string().max(500).optional(),
  publishableKey: z.string().max(500).optional(),
});

// Settings email config
export const emailConfigSchema = z.object({
  provider: z.enum(['resend', 'sendgrid', 'mailgun']).optional(),
  apiKey: z.string().max(500).optional(),
  fromEmail: emailSchema.optional(),
  fromName: z.string().max(100).optional(),
  replyTo: emailSchema.optional(),
});

// Helper to validate and parse request body
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const issues = result.error.issues || [];
      const errors = issues.map((e) =>
        `${String(e.path.join('.'))}: ${e.message}`
      ).join(', ');
      return { success: false, error: `Validation failed: ${errors}` };
    }

    return { success: true, data: result.data };
  } catch {
    return { success: false, error: 'Invalid JSON body' };
  }
}
