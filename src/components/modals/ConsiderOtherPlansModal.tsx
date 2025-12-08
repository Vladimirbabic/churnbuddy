'use client';

import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { getDesignStyleConfig } from '@/lib/designStyles';

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
  designStyle?: number;
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
  designStyle = 1,
}: ConsiderOtherPlansModalProps) {
  const styleConfig = getDesignStyleConfig(designStyle);

  if (!isOpen) return null;

  // Preview mode - render without backdrop and fixed positioning
  // Uses style configuration for different visual styles
  if (previewMode) {
    const sc = styleConfig; // shorthand
    const useColorsProp = true; // Always use colors prop for dynamic coloring

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consider-plans-title"
        className={`w-full max-w-lg overflow-hidden ${sc.container.background} ${sc.container.border} ${sc.container.borderRadius} ${sc.container.shadow} ${sc.container.extraClasses || ''}`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between ${sc.header.padding} ${sc.header.background} ${sc.header.border}`}
          style={useColorsProp ? { backgroundColor: colors.background } : undefined}
        >
          <div className="flex items-center gap-2">
            {sc.header.iconBackground ? (
              <div className={`w-8 h-8 rounded-full ${sc.header.iconBackground} flex items-center justify-center`}>
                <RotateCcw className={`h-4 w-4 ${sc.header.iconColor}`} />
              </div>
            ) : (
              <RotateCcw
                className="h-4 w-4"
                style={useColorsProp ? { color: colors.primary } : undefined}
              />
            )}
            <span
              className={`font-semibold text-sm ${sc.header.titleColor} ${sc.fonts?.heading || ''}`}
              style={useColorsProp ? { color: colors.primary } : undefined}
            >
              {designStyle === 4 ? 'OTHER PLANS' : 'Consider Other Plans'}
            </span>
          </div>
          <button
            onClick={onClose}
            className={`${sc.header.closeButtonClasses} cursor-pointer`}
            aria-label="Close modal"
          >
            <X className="h-4 w-4" style={useColorsProp ? { color: colors.primary } : undefined} strokeWidth={designStyle === 4 ? 3 : 2} />
          </button>
        </div>

        {/* Content */}
        <div className={sc.content.padding}>
          {/* Main Title */}
          <h2
            id="consider-plans-title"
            className={`text-center ${sc.content.titleClasses} ${sc.fonts?.heading || ''}`}
            style={useColorsProp ? { color: colors.text } : undefined}
          >
            {designStyle === 4 ? copy.title.toUpperCase() : copy.title}
          </h2>

          {/* Subtext */}
          <p
            className={`text-center ${sc.content.subtitleClasses}`}
            style={useColorsProp ? { color: colors.text, opacity: 0.7 } : undefined}
          >
            {copy.subtitle}
          </p>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-4 ${sc.isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'} ${sc.container.borderRadius || 'rounded-2xl'} shadow-lg border`}
              >
                {/* Plan Name */}
                <h3 className={`font-semibold text-lg mb-2 ${sc.isDark ? 'text-white' : ''} ${sc.fonts?.heading || ''}`} style={useColorsProp ? { color: colors.text } : undefined}>
                  {designStyle === 4 ? plan.name.toUpperCase() : plan.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`line-through text-sm ${sc.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    ${plan.originalPrice}
                  </span>
                  <span
                    className={`font-bold text-2xl ${designStyle === 3 ? 'bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent' : ''} ${designStyle === 4 ? 'text-lime-500' : ''} ${designStyle === 5 ? 'text-purple-400' : ''} ${designStyle === 6 ? 'text-purple-500' : ''} ${designStyle === 8 ? 'text-purple-600' : ''}`}
                    style={useColorsProp ? { color: colors.primary } : undefined}
                  >
                    ${getDiscountedPrice(plan.originalPrice, plan.discountPercent)}
                  </span>
                  <span className={`text-sm ${sc.isDark ? 'text-gray-400' : 'text-gray-500'}`}>{plan.period}</span>
                </div>
                <p className={`text-xs mb-4 ${sc.isDark ? 'text-gray-500' : 'text-muted-foreground'}`}>
                  {plan.discountPercent}% off for {plan.discountDurationMonths} months
                </p>

                {/* Highlights */}
                <div className="mb-4">
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${sc.isDark ? 'text-gray-500' : 'text-[#9CA3AF]'}`}>
                    Highlights
                  </p>
                  <ul className="space-y-1">
                    {plan.highlights.map((feature, index) => (
                      <li key={index} className={`text-sm ${sc.isDark ? 'text-gray-300' : ''}`} style={useColorsProp ? { color: colors.text, opacity: 0.8 } : undefined}>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onSwitchPlan(plan.id)}
                  className={`w-full font-medium py-2 px-4 transition-colors ${
                    designStyle === 3 ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl' :
                    designStyle === 4 ? 'bg-black text-white border-[3px] border-black font-black uppercase' :
                    designStyle === 5 ? 'bg-purple-500 text-white rounded-lg' :
                    designStyle === 6 ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-2xl' :
                    designStyle === 7 ? 'bg-blue-600 text-white' :
                    designStyle === 8 ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl' :
                    designStyle === 9 ? 'bg-stone-800 text-white rounded-md' :
                    'text-white rounded-lg hover:opacity-90'
                  }`}
                  style={useColorsProp ? { backgroundColor: colors.primary } : undefined}
                >
                  {designStyle === 4 ? 'SWITCH PLAN' : 'Switch Plan'}
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className={`flex ${designStyle === 3 || designStyle === 8 ? 'gap-3' : 'justify-between gap-4'} mt-6`}>
            <button
              onClick={onBack}
              className={`${sc.footer.backButton} transition-colors`}
              style={useColorsProp ? { backgroundColor: colors.background, color: colors.text } : undefined}
            >
              {designStyle === 4 ? 'BACK' : 'Back'}
            </button>
            <button
              onClick={onDecline}
              className={`${sc.footer.primaryButton} transition-colors`}
            >
              {designStyle === 4 ? 'DECLINE OFFER' : 'Decline Offer'}
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
