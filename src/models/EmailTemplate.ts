// =============================================================================
// Email Template Model
// =============================================================================
// Stores customizable email templates for payment reminders and notifications

import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailTemplate extends Document {
  organizationId: string;
  type: 'payment_failed' | 'payment_reminder' | 'subscription_canceled' | 'offer_accepted' | 'custom';
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
  variables: string[]; // Available merge tags like {{customer_name}}, {{amount}}
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['payment_failed', 'payment_reminder', 'subscription_canceled', 'offer_accepted', 'custom'],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    variables: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
EmailTemplateSchema.index({ organizationId: 1, type: 1 });

export default mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);
