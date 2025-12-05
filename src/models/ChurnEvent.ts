// =============================================================================
// MongoDB Event Schema (Mongoose)
// =============================================================================
// This schema logs all churn-related events for analytics and dashboard display.
// Events include: payment failures, cancellation attempts, offer acceptances,
// subscription cancellations, and recoveries.

import mongoose, { Schema, Document, Model } from 'mongoose';

// Event type enum for type safety
export type ChurnEventType =
  | 'payment_failed'        // Initial payment failure detected
  | 'payment_retry_sent'    // Dunning email sent to customer
  | 'payment_recovered'     // Previously failed payment succeeded
  | 'cancellation_attempt'  // User initiated cancellation (modal shown)
  | 'offer_accepted'        // User accepted the save offer (discount)
  | 'offer_declined'        // User declined offer and confirmed cancel
  | 'subscription_canceled' // Subscription fully canceled in Stripe
  | 'subscription_updated'  // Subscription modified (plan change, reactivation)
  | 'subscription_recovered'; // Previously delinquent subscription is now active

// Interface for the ChurnEvent document
export interface IChurnEvent extends Document {
  eventType: ChurnEventType;
  timestamp: Date;

  // Customer identifiers
  customerId: string;          // Stripe customer ID
  customerEmail?: string;      // Customer email for quick reference
  subscriptionId?: string;     // Stripe subscription ID
  invoiceId?: string;          // Stripe invoice ID (for payment events)

  // Event-specific details
  details: {
    failureReason?: string;           // Stripe decline reason
    failureCode?: string;             // Stripe error code
    cancellationReason?: string;      // User-selected reason from survey
    cancellationFeedback?: string;    // Free-text feedback from user
    discountOffered?: number;         // Percentage discount offered (e.g., 20)
    discountAccepted?: boolean;       // Whether user accepted the discount
    amountDue?: number;               // Invoice amount in cents
    currency?: string;                // Currency code (e.g., 'usd')
    planId?: string;                  // Subscription plan/price ID
    previousStatus?: string;          // Status before update
    newStatus?: string;               // Status after update
    mrrImpact?: number;               // Monthly recurring revenue impact in cents
  };

  // Metadata
  source: 'webhook' | 'cancel_flow' | 'api' | 'manual';
  processed: boolean;           // Whether follow-up actions completed
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema definition
const ChurnEventSchema = new Schema<IChurnEvent>(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        'payment_failed',
        'payment_retry_sent',
        'payment_recovered',
        'cancellation_attempt',
        'offer_accepted',
        'offer_declined',
        'subscription_canceled',
        'subscription_updated',
        'subscription_recovered',
      ],
      index: true, // Index for fast filtering by event type
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true, // Index for time-based queries
    },
    customerId: {
      type: String,
      required: true,
      index: true, // Index for customer lookups
    },
    customerEmail: {
      type: String,
      index: true,
    },
    subscriptionId: {
      type: String,
      index: true,
    },
    invoiceId: {
      type: String,
      sparse: true, // Sparse index since not all events have invoices
    },
    details: {
      failureReason: String,
      failureCode: String,
      cancellationReason: String,
      cancellationFeedback: String,
      discountOffered: Number,
      discountAccepted: Boolean,
      amountDue: Number,
      currency: String,
      planId: String,
      previousStatus: String,
      newStatus: String,
      mrrImpact: Number,
    },
    source: {
      type: String,
      required: true,
      enum: ['webhook', 'cancel_flow', 'api', 'manual'],
      default: 'webhook',
    },
    processed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Compound index for common queries (dashboard, analytics)
ChurnEventSchema.index({ eventType: 1, timestamp: -1 });
ChurnEventSchema.index({ customerId: 1, timestamp: -1 });

// Static method to get metrics for dashboard
ChurnEventSchema.statics.getMetrics = async function(startDate?: Date, endDate?: Date) {
  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = startDate;
  if (endDate) dateFilter.$lte = endDate;

  const matchStage = Object.keys(dateFilter).length > 0
    ? { timestamp: dateFilter }
    : {};

  const metrics = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        totalMrrImpact: { $sum: '$details.mrrImpact' },
      },
    },
  ]);

  return metrics;
};

// Prevent model recompilation in development (hot reload)
const ChurnEvent: Model<IChurnEvent> =
  mongoose.models.ChurnEvent || mongoose.model<IChurnEvent>('ChurnEvent', ChurnEventSchema);

export default ChurnEvent;
