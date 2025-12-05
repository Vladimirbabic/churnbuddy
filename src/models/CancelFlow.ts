// =============================================================================
// Cancel Flow Model
// =============================================================================
// Stores multiple cancel flow configurations for different products/scenarios

import mongoose, { Document, Schema } from 'mongoose';
import { ModalTheme } from '@/lib/modalThemes';

export interface ICancelFlowReason {
  id: string;
  label: string;
}

export interface ICancelFlow extends Document {
  organizationId: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;

  // Targeting - which customers see this flow
  targetType: 'all' | 'product' | 'plan' | 'custom';
  targetProductIds?: string[];
  targetPlanIds?: string[];
  targetCustomerSegment?: string;

  // Appearance
  theme: ModalTheme;

  // Content
  headerTitle: string;
  headerDescription: string;
  offerTitle: string;
  offerDescription?: string;

  // Reasons
  reasons: ICancelFlowReason[];

  // Offer settings
  discountPercent: number;
  discountDuration: number; // in months
  showOffer: boolean;

  // Stats
  impressions: number;
  cancellations: number;
  saves: number;

  createdAt: Date;
  updatedAt: Date;
}

const CancelFlowReasonSchema = new Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
}, { _id: false });

const CancelFlowSchema = new Schema<ICancelFlow>(
  {
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },

    // Targeting
    targetType: {
      type: String,
      enum: ['all', 'product', 'plan', 'custom'],
      default: 'all',
    },
    targetProductIds: [{
      type: String,
    }],
    targetPlanIds: [{
      type: String,
    }],
    targetCustomerSegment: {
      type: String,
    },

    // Appearance
    theme: {
      type: String,
      enum: ['minimal', 'gradient', 'soft', 'bold', 'glass', 'dark'],
      default: 'minimal',
    },

    // Content
    headerTitle: {
      type: String,
      default: "We're sorry to see you go",
    },
    headerDescription: {
      type: String,
      default: "Before you go, please help us improve by sharing why you're canceling",
    },
    offerTitle: {
      type: String,
      default: "Wait! We have an offer for you",
    },
    offerDescription: {
      type: String,
    },

    // Reasons
    reasons: {
      type: [CancelFlowReasonSchema],
      default: [
        { id: 'too_expensive', label: 'Too expensive' },
        { id: 'not_using', label: 'Not using it enough' },
        { id: 'missing_features', label: 'Missing features I need' },
        { id: 'found_alternative', label: 'Found a better alternative' },
        { id: 'technical_issues', label: 'Technical issues or bugs' },
        { id: 'poor_support', label: 'Poor customer support' },
        { id: 'temporary', label: 'Just need a break (temporary)' },
        { id: 'other', label: 'Other reason' },
      ],
    },

    // Offer settings
    discountPercent: {
      type: Number,
      default: 20,
      min: 5,
      max: 50,
    },
    discountDuration: {
      type: Number,
      default: 3,
      min: 1,
      max: 12,
    },
    showOffer: {
      type: Boolean,
      default: true,
    },

    // Stats
    impressions: {
      type: Number,
      default: 0,
    },
    cancellations: {
      type: Number,
      default: 0,
    },
    saves: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
CancelFlowSchema.index({ organizationId: 1, isActive: 1 });
CancelFlowSchema.index({ organizationId: 1, isDefault: 1 });

// Ensure only one default flow per organization
CancelFlowSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.models.CancelFlow?.updateMany(
      { organizationId: this.organizationId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

export default mongoose.models.CancelFlow || mongoose.model<ICancelFlow>('CancelFlow', CancelFlowSchema);
