'use client';

import React from 'react';
import { X, RotateCcw } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  stripePriceId?: string;
  stripeProductId?: string;
  originalPrice: number;
  discountPercent: number;
  discountDurationMonths: number;
  period: string;
  highlights: string[];
}

interface CopySettings {
  title: string;
  subtitle: string;
}

interface ColorSettings {
  primary: string;
  background: string;
  text: string;
}

interface ConsiderOtherPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onDecline: () => void;
  onSwitchPlan: (planId: string) => void;
  plans?: Plan[];
  previewMode?: boolean;
  copy?: CopySettings;
  colors?: ColorSettings;
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    originalPrice: 29,
    discountPercent: 80,
    discountDurationMonths: 3,
    period: '/mo',
    highlights: [
      '5 projects',
      'Basic analytics',
      'Email support',
      '1GB storage',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    originalPrice: 79,
    discountPercent: 80,
    discountDurationMonths: 3,
    period: '/mo',
    highlights: [
      '25 projects',
      'Advanced analytics',
      'Priority support',
      '10GB storage',
    ],
  },
];

// Helper to calculate discounted price
const getDiscountedPrice = (originalPrice: number, discountPercent: number) => {
  return (originalPrice * (1 - discountPercent / 100)).toFixed(2);
};

const DEFAULT_COPY: CopySettings = {
  title: "How about 80% off of one of our other plans? These aren't public.",
  subtitle: "You'd keep all your history and settings and enjoy much of the same functionality at a lower rate.",
};

const DEFAULT_COLORS: ColorSettings = {
  primary: '#2563EB',
  background: '#F0F4FF',
  text: '#1F2937',
};

export function ConsiderOtherPlansModal({
  isOpen,
  onClose,
  onBack,
  onDecline,
  onSwitchPlan,
  plans = DEFAULT_PLANS,
  previewMode = false,
  copy = DEFAULT_COPY,
  colors = DEFAULT_COLORS,
}: ConsiderOtherPlansModalProps) {
  if (!isOpen) return null;

  // Preview mode - render without backdrop and fixed positioning
  if (previewMode) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consider-plans-title"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: colors.background }}>
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" style={{ color: colors.primary }} />
            <span className="font-semibold text-sm" style={{ color: colors.primary }}>
              Consider Other Plans
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:opacity-80 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" style={{ color: colors.primary }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Main Title */}
          <h2
            id="consider-plans-title"
            className="text-center font-bold text-[22px] mt-4"
            style={{ color: colors.text }}
          >
            {copy.title}
          </h2>

          {/* Subtext */}
          <p className="text-center text-sm mt-2 mb-6" style={{ color: colors.text, opacity: 0.7 }}>
            {copy.subtitle}
          </p>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100"
              >
                {/* Plan Name */}
                <h3 className="font-semibold text-lg mb-2" style={{ color: colors.text }}>
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-gray-400 line-through text-sm">
                    ${plan.originalPrice}
                  </span>
                  <span className="font-bold text-2xl" style={{ color: colors.primary }}>
                    ${getDiscountedPrice(plan.originalPrice, plan.discountPercent)}
                  </span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  {plan.discountPercent}% off for {plan.discountDurationMonths} months
                </p>

                {/* Highlights */}
                <div className="mb-4">
                  <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                    Highlights
                  </p>
                  <ul className="space-y-1">
                    {plan.highlights.map((feature, index) => (
                      <li key={index} className="text-sm" style={{ color: colors.text, opacity: 0.8 }}>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onSwitchPlan(plan.id)}
                  className="w-full text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-colors"
                  style={{ backgroundColor: colors.primary }}
                >
                  Switch Plan
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-between mt-6">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: colors.background, color: colors.text }}
            >
              Back
            </button>
            <button
              onClick={onDecline}
              className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Decline Offer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consider-plans-title"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#F0F4FF]">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-[#606C80]" />
            <span className="font-semibold text-sm text-[#606C80]">
              Consider Other Plans
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4 text-[#606C80]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Main Title */}
          <h2
            id="consider-plans-title"
            className="text-center font-bold text-[22px] text-[#1F2D3D] mt-4"
          >
            How about 80% off of one of our other plans? These aren't public.
          </h2>

          {/* Subtext */}
          <p className="text-center text-sm text-[#6B7280] mt-2 mb-6">
            You'd keep all your history and settings and enjoy much of the same
            functionality at a lower rate.
          </p>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100"
              >
                {/* Plan Name */}
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-gray-400 line-through text-sm">
                    ${plan.originalPrice}
                  </span>
                  <span className="text-blue-600 font-bold text-2xl">
                    ${getDiscountedPrice(plan.originalPrice, plan.discountPercent)}
                  </span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  {plan.discountPercent}% off for {plan.discountDurationMonths} months
                </p>

                {/* Highlights */}
                <div className="mb-4">
                  <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                    Highlights
                  </p>
                  <ul className="space-y-1">
                    {plan.highlights.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onSwitchPlan(plan.id)}
                  className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Switch Plan
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-between mt-6">
            <button
              onClick={onBack}
              className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <button
              onClick={onDecline}
              className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Decline Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConsiderOtherPlansModal;
