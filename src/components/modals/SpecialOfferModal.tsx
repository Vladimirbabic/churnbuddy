'use client';

import React from 'react';
import { X, Tag, Clock } from 'lucide-react';
import { getDesignStyleConfig } from '@/lib/designStyles';

interface CopySettings {
  title: string;
  subtitle: string;
}

interface ColorSettings {
  primary: string;
  background: string;
  text: string;
}

interface SpecialOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onDecline: () => void;
  onAcceptOffer: () => void;
  discountPercent?: number;
  discountDuration?: string;
  previewMode?: boolean;
  isProcessing?: boolean;
  error?: { title: string; message: string } | null;
  onClearError?: () => void;
  copy?: CopySettings;
  colors?: ColorSettings;
  showCountdown?: boolean;
  countdownMinutes?: number;
  designStyle?: number;
}

const DEFAULT_COPY: CopySettings = {
  title: "Stay to get {discount}% off for {duration}. We'd hate to lose you.",
  subtitle: "You're eligible for our special discount.",
};

const DEFAULT_COLORS: ColorSettings = {
  primary: '#DC2626',
  background: '#FEF2F2',
  text: '#1F2937',
};

export function SpecialOfferModal({
  isOpen,
  onClose,
  onBack,
  onDecline,
  onAcceptOffer,
  discountPercent = 50,
  discountDuration = '3 months',
  previewMode = false,
  isProcessing = false,
  error = null,
  onClearError,
  copy = DEFAULT_COPY,
  colors = DEFAULT_COLORS,
  showCountdown = true,
  countdownMinutes = 10,
  designStyle = 1,
}: SpecialOfferModalProps) {
  const styleConfig = getDesignStyleConfig(designStyle);

  // Replace placeholders in title
  const processedTitle = copy.title
    .replace('{discount}', String(discountPercent))
    .replace('{duration}', discountDuration);

  if (!isOpen) return null;

  // Preview mode - render without backdrop and fixed positioning
  // Uses style configuration for different visual styles
  if (previewMode) {
    const sc = styleConfig; // shorthand
    const useColorsProp = designStyle === 1; // Only use colors prop for Classic Card

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="special-offer-title"
        className={`w-full max-w-md overflow-hidden ${sc.container.background} ${sc.container.border} ${sc.container.borderRadius} ${sc.container.shadow} ${sc.container.extraClasses || ''}`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between ${sc.header.padding} ${sc.header.background} ${sc.header.border}`}
          style={useColorsProp ? { backgroundColor: colors.background } : undefined}
        >
          <div className="flex items-center gap-2">
            {sc.header.iconBackground ? (
              <div className={`w-8 h-8 rounded-full ${sc.header.iconBackground} flex items-center justify-center`}>
                <Tag className={`h-4 w-4 ${sc.header.iconColor}`} />
              </div>
            ) : (
              <Tag
                className="h-4 w-4"
                style={useColorsProp ? { color: colors.primary } : undefined}
              />
            )}
            <span
              className={`font-semibold text-sm ${sc.header.titleColor} ${sc.fonts?.heading || ''}`}
              style={useColorsProp ? { color: colors.primary } : undefined}
            >
              {designStyle === 4 ? 'SPECIAL OFFER' : 'Special Offer'}
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
            id="special-offer-title"
            className={`${sc.content.titleClasses} ${sc.fonts?.heading || ''}`}
            style={useColorsProp ? { color: colors.text } : undefined}
          >
            {designStyle === 4 ? processedTitle.toUpperCase() : processedTitle}
          </h2>

          {/* Subtext */}
          <p className={sc.content.subtitleClasses} style={useColorsProp ? { color: colors.text, opacity: 0.7 } : undefined}>
            {copy.subtitle}
          </p>

          {/* Offer Card */}
          <div
            className={`p-6 text-center ${
              designStyle === 4 ? 'border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-lime-100' :
              designStyle === 5 ? 'rounded-xl bg-purple-500/20 border border-purple-500/30' :
              designStyle === 3 ? 'rounded-2xl bg-violet-50/50 border-2 border-violet-500/30' :
              designStyle === 6 ? 'rounded-3xl bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-purple-200' :
              designStyle === 7 ? 'bg-blue-50 border border-blue-200' :
              designStyle === 8 ? 'rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50' :
              designStyle === 9 ? 'rounded-md bg-amber-50 border border-amber-200' :
              'rounded-2xl'
            }`}
            style={useColorsProp ? { backgroundColor: colors.background, border: `1px solid ${colors.primary}20` } : undefined}
          >
            {/* Time-Limited Label */}
            {showCountdown && (
              <div className="flex items-center justify-center gap-2 mb-3">
                <Clock
                  className={`h-4 w-4 ${
                    designStyle === 4 ? 'text-black' :
                    designStyle === 5 ? 'text-purple-400' :
                    designStyle === 3 ? 'text-violet-600' :
                    designStyle === 6 ? 'text-purple-500' :
                    designStyle === 7 ? 'text-blue-600' :
                    designStyle === 8 ? 'text-purple-600' :
                    designStyle === 9 ? 'text-amber-600' :
                    ''
                  }`}
                  style={useColorsProp ? { color: colors.primary } : undefined}
                />
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    designStyle === 4 ? 'text-black' :
                    designStyle === 5 ? 'text-purple-400' :
                    designStyle === 3 ? 'text-violet-600' :
                    designStyle === 6 ? 'text-purple-500' :
                    designStyle === 7 ? 'text-blue-600' :
                    designStyle === 8 ? 'text-purple-600' :
                    designStyle === 9 ? 'text-amber-600' :
                    ''
                  }`}
                  style={useColorsProp ? { color: colors.primary } : undefined}
                >
                  {countdownMinutes} Minutes Left
                </span>
              </div>
            )}

            {/* Main Deal */}
            <p
              className={`text-2xl font-bold mb-4 ${
                designStyle === 3 ? 'bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent' :
                designStyle === 4 ? 'text-black font-black uppercase' :
                designStyle === 5 ? 'text-white' :
                designStyle === 8 ? 'text-purple-600' :
                sc.isDark ? 'text-white' : ''
              }`}
              style={useColorsProp ? { color: colors.text } : undefined}
            >
              {discountPercent}% off for {discountDuration}
            </p>

            {/* CTA Button */}
            <button
              onClick={onAcceptOffer}
              className={`w-full font-semibold py-3 px-4 transition-colors ${
                designStyle === 3 ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl shadow-lg shadow-violet-500/30' :
                designStyle === 4 ? 'bg-black text-lime-300 border-[3px] border-black font-black uppercase' :
                designStyle === 5 ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl' :
                designStyle === 6 ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-2xl' :
                designStyle === 7 ? 'bg-blue-600 text-white' :
                designStyle === 8 ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white rounded-xl font-bold' :
                designStyle === 9 ? 'bg-stone-800 text-white rounded-md' :
                'text-white rounded-lg hover:opacity-90'
              }`}
              style={useColorsProp ? { backgroundColor: colors.primary } : undefined}
            >
              {designStyle === 4 ? 'ACCEPT THIS OFFER' : 'Accept This Offer'}
            </button>
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
        aria-labelledby="special-offer-title"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#FEF2F2]">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-[#DC2626]" />
            <span className="font-semibold text-sm text-[#DC2626]">
              Special Offer
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4 text-[#DC2626]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {isProcessing ? (
            /* Processing State */
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-r-transparent mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Applying your discount...</h3>
              <p className="text-sm text-gray-600 mt-1">This will only take a moment.</p>
            </div>
          ) : error ? (
            /* Error State */
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{error.title}</h3>
              <p className="text-sm text-gray-600 mb-6">{error.message}</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={onClearError}
                  className="bg-gray-100 text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Normal Offer Content */
            <>
              {/* Main Title */}
              <h2
                id="special-offer-title"
                className="font-bold text-[22px] text-gray-900 mt-2"
              >
                Stay to get {discountPercent}% off for {discountDuration}. We'd hate to lose you.
              </h2>

              {/* Subtext */}
              <p className="text-sm text-gray-600 mt-1 mb-6">
                You're eligible for our special discount.
              </p>

              {/* Offer Card */}
              <div className="bg-[#FEF2F2] border border-red-100 rounded-2xl p-6 text-center">
                {/* Time-Limited Label */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-[#B91C1C]" />
                  <span className="text-[10px] font-bold text-[#B91C1C] uppercase tracking-wider">
                    Time-Limited Deal
                  </span>
                </div>

                {/* Main Deal */}
                <p className="text-2xl font-bold text-gray-900 mb-4">
                  {discountPercent}% off for {discountDuration}
                </p>

                {/* CTA Button */}
                <button
                  onClick={onAcceptOffer}
                  className="w-full bg-red-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Accept This Offer
                </button>
              </div>

              {/* Footer */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={onBack}
                  className="bg-gray-100 text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SpecialOfferModal;
