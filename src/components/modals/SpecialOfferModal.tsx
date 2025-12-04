'use client';

import React from 'react';
import { X, Tag, Clock } from 'lucide-react';

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
}

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
}: SpecialOfferModalProps) {
  if (!isOpen) return null;

  // Preview mode - render without backdrop and fixed positioning
  if (previewMode) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="special-offer-title"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
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
