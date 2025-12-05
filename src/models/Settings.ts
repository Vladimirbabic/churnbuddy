// =============================================================================
// Settings Model (Mongoose)
// =============================================================================
// Stores user/organization configuration for ChurnBuddy including:
// - Stripe API keys and webhook configuration
// - Email settings (Resend/SendGrid)
// - Cancel flow customization
// - Dunning email sequences

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  // Organization identifier (for multi-tenant support)
  organizationId: string;

  // Onboarding status
  onboardingCompleted: boolean;
  onboardingStep: number;

  // Stripe Configuration
  stripe: {
    secretKey?: string;           // Encrypted in production
    webhookSecret?: string;       // Encrypted in production
    publishableKey?: string;
    isConnected: boolean;
    testMode: boolean;
  };

  // Email Configuration
  email: {
    provider: 'resend' | 'sendgrid' | 'smtp';
    apiKey?: string;              // Encrypted in production
    fromEmail: string;
    fromName: string;
    replyTo?: string;
    isConnected: boolean;
  };

  // Cancel Flow Settings
  cancelFlow: {
    enabled: boolean;
    discountPercent: number;      // Default discount to offer (e.g., 20)
    discountDuration: number;     // Duration in months (e.g., 3)
    showSurvey: boolean;
    customReasons: string[];      // Custom cancellation reasons
    successMessage?: string;
    companyName: string;
  };

  // Dunning Settings
  dunning: {
    enabled: boolean;
    emailSequence: {
      day: number;                // Days after failure (0 = immediate)
      subject: string;
      urgencyLevel: 'low' | 'medium' | 'high';
    }[];
    maxAttempts: number;
    includeBillingPortalLink: boolean;
  };

  // Branding
  branding: {
    logoUrl?: string;
    primaryColor: string;
    companyName: string;
  };

  // Notification Settings
  notifications: {
    emailOnFailedPayment: boolean;
    emailOnCancellation: boolean;
    emailOnRecovery: boolean;
    slackWebhookUrl?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    organizationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    onboardingStep: {
      type: Number,
      default: 0,
    },
    stripe: {
      secretKey: String,
      webhookSecret: String,
      publishableKey: String,
      isConnected: { type: Boolean, default: false },
      testMode: { type: Boolean, default: true },
    },
    email: {
      provider: {
        type: String,
        enum: ['resend', 'sendgrid', 'smtp'],
        default: 'resend',
      },
      apiKey: String,
      fromEmail: { type: String, default: '' },
      fromName: { type: String, default: '' },
      replyTo: String,
      isConnected: { type: Boolean, default: false },
    },
    cancelFlow: {
      enabled: { type: Boolean, default: true },
      discountPercent: { type: Number, default: 20 },
      discountDuration: { type: Number, default: 3 },
      showSurvey: { type: Boolean, default: true },
      customReasons: { type: [String], default: [] },
      successMessage: String,
      companyName: { type: String, default: '' },
    },
    dunning: {
      enabled: { type: Boolean, default: true },
      emailSequence: {
        type: [{
          day: Number,
          subject: String,
          urgencyLevel: {
            type: String,
            enum: ['low', 'medium', 'high'],
          },
        }],
        default: [
          { day: 0, subject: 'Payment failed - action required', urgencyLevel: 'low' },
          { day: 3, subject: 'Reminder: Please update your payment method', urgencyLevel: 'medium' },
          { day: 7, subject: 'Final notice: Your subscription will be cancelled', urgencyLevel: 'high' },
        ],
      },
      maxAttempts: { type: Number, default: 3 },
      includeBillingPortalLink: { type: Boolean, default: true },
    },
    branding: {
      logoUrl: String,
      primaryColor: { type: String, default: '#3b82f6' },
      companyName: { type: String, default: '' },
    },
    notifications: {
      emailOnFailedPayment: { type: Boolean, default: true },
      emailOnCancellation: { type: Boolean, default: true },
      emailOnRecovery: { type: Boolean, default: true },
      slackWebhookUrl: String,
    },
  },
  {
    timestamps: true,
  }
);

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
