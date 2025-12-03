'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, Check } from 'lucide-react';

interface FeedbackOption {
  id: string;
  label: string;
  letter: string;
}

interface YourFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onNext: (selectedOption: string) => void;
  options?: FeedbackOption[];
  previewMode?: boolean;
}

const DEFAULT_OPTIONS: FeedbackOption[] = [
  { id: 'too_expensive', label: 'Too expensive for what I get', letter: 'A' },
  { id: 'not_using', label: "I'm not using it enough", letter: 'B' },
  { id: 'missing_features', label: 'Missing features I need', letter: 'C' },
  { id: 'found_alternative', label: 'Found a better alternative', letter: 'D' },
  { id: 'other', label: 'Other reason', letter: 'E' },
];

export function YourFeedbackModal({
  isOpen,
  onClose,
  onBack,
  onNext,
  options = DEFAULT_OPTIONS,
  previewMode = false,
}: YourFeedbackModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Reset selection when options change (for preview)
  useEffect(() => {
    setSelectedOption(null);
  }, [options]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (selectedOption) {
      onNext(selectedOption);
    }
  };

  // Preview mode - render without backdrop and fixed positioning
  if (previewMode) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#F5F3FF]">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-[#9333EA] fill-[#9333EA]" />
            <span className="font-semibold text-sm text-[#9333EA]">
              Your Feedback
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-purple-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4 text-[#9333EA]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Main Title */}
          <h2
            id="feedback-title"
            className="font-bold text-[22px] text-gray-900 mt-2"
          >
            Sorry to see you go.
          </h2>

          {/* Subtext */}
          <p className="text-sm text-gray-600 mt-1 mb-6">
            Please be honest about why you're leaving. It's the only way we can
            improve.
          </p>

          {/* Option List */}
          <div className="space-y-3">
            {options.map((option) => {
              const isSelected = selectedOption === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left ${
                    isSelected
                      ? 'bg-[#F3E8FF] border-[#9333EA] border-2'
                      : 'bg-[#F3E8FF] border-[#E9D5FF] hover:border-[#D8B4FE]'
                  }`}
                  aria-pressed={isSelected}
                >
                  {/* Letter Badge */}
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                      isSelected
                        ? 'bg-[#9333EA] text-white'
                        : 'bg-white text-gray-600 border border-[#E9D5FF]'
                    }`}
                  >
                    {option.letter}
                  </span>

                  {/* Label */}
                  <span className="flex-1 font-medium text-gray-800">
                    {option.label}
                  </span>

                  {/* Checkmark for selected */}
                  {isSelected && (
                    <Check className="h-5 w-5 text-[#9333EA]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex justify-between mt-6">
            <button
              onClick={onBack}
              className="bg-purple-100 text-purple-900 px-4 py-2 rounded-lg font-medium hover:bg-purple-200 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedOption}
              className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
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
        aria-labelledby="feedback-title"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#F5F3FF]">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-[#9333EA] fill-[#9333EA]" />
            <span className="font-semibold text-sm text-[#9333EA]">
              Your Feedback
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-purple-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4 text-[#9333EA]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Main Title */}
          <h2
            id="feedback-title"
            className="font-bold text-[22px] text-gray-900 mt-2"
          >
            Sorry to see you go.
          </h2>

          {/* Subtext */}
          <p className="text-sm text-gray-600 mt-1 mb-6">
            Please be honest about why you're leaving. It's the only way we can
            improve.
          </p>

          {/* Option List */}
          <div className="space-y-3">
            {options.map((option) => {
              const isSelected = selectedOption === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left ${
                    isSelected
                      ? 'bg-[#F3E8FF] border-[#9333EA] border-2'
                      : 'bg-[#F3E8FF] border-[#E9D5FF] hover:border-[#D8B4FE]'
                  }`}
                  aria-pressed={isSelected}
                >
                  {/* Letter Badge */}
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                      isSelected
                        ? 'bg-[#9333EA] text-white'
                        : 'bg-white text-gray-600 border border-[#E9D5FF]'
                    }`}
                  >
                    {option.letter}
                  </span>

                  {/* Label */}
                  <span className="flex-1 font-medium text-gray-800">
                    {option.label}
                  </span>

                  {/* Checkmark for selected */}
                  {isSelected && (
                    <Check className="h-5 w-5 text-[#9333EA]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex justify-between mt-6">
            <button
              onClick={onBack}
              className="bg-purple-100 text-purple-900 px-4 py-2 rounded-lg font-medium hover:bg-purple-200 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedOption}
              className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default YourFeedbackModal;
