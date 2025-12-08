'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, Check } from 'lucide-react';
import { getDesignStyleConfig, type DesignStyleConfig } from '@/lib/designStyles';

interface FeedbackOption {
  id: string;
  label: string;
  letter: string;
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

interface YourFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onNext: (selectedOption: string, otherText?: string) => void;
  options?: FeedbackOption[];
  previewMode?: boolean;
  copy?: CopySettings;
  colors?: ColorSettings;
  allowOtherOption?: boolean;
  designStyle?: number;
}

const DEFAULT_OPTIONS: FeedbackOption[] = [
  { id: 'too_expensive', label: 'Too expensive for what I get', letter: 'A' },
  { id: 'not_using', label: "I'm not using it enough", letter: 'B' },
  { id: 'missing_features', label: 'Missing features I need', letter: 'C' },
  { id: 'found_alternative', label: 'Found a better alternative', letter: 'D' },
];

const DEFAULT_COPY: CopySettings = {
  title: 'Sorry to see you go.',
  subtitle: "Please be honest about why you're leaving. It's the only way we can improve.",
};

const DEFAULT_COLORS: ColorSettings = {
  primary: '#9333EA',
  background: '#F5F3FF',
  text: '#1F2937',
};

export function YourFeedbackModal({
  isOpen,
  onClose,
  onBack,
  onNext,
  options = DEFAULT_OPTIONS,
  previewMode = false,
  copy = DEFAULT_COPY,
  colors = DEFAULT_COLORS,
  allowOtherOption = true,
  designStyle = 1,
}: YourFeedbackModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');
  const styleConfig = getDesignStyleConfig(designStyle);

  // Reset selection when options change (for preview)
  useEffect(() => {
    setSelectedOption(null);
    setOtherText('');
  }, [options, allowOtherOption]);

  if (!isOpen) return null;

  // Filter out any existing "other" option from the provided options and add it at the end if allowed
  const regularOptions = options.filter(opt => opt.id !== 'other');
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const displayOptions = regularOptions.map((opt, idx) => ({
    ...opt,
    letter: letters[idx] || 'X',
  }));

  // Add "Other" option at the end if allowed
  const otherOptionLetter = letters[displayOptions.length] || 'X';

  const handleNext = () => {
    if (selectedOption) {
      onNext(selectedOption, selectedOption === 'other' ? otherText : undefined);
    }
  };

  const isNextDisabled = !selectedOption || (selectedOption === 'other' && !otherText.trim());

  // Preview mode - render without backdrop and fixed positioning
  // Uses style configuration for different visual styles
  if (previewMode) {
    const sc = styleConfig; // shorthand
    const showLetterBadge = sc.option.default.letterBadge.background !== 'hidden';

    // Always use colors prop for dynamic coloring (applies to all design styles)
    const useColorsProp = true;

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
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
                <Heart className={`h-4 w-4 ${sc.header.iconColor}`} />
              </div>
            ) : (
              <Heart
                className="h-4 w-4"
                style={useColorsProp ? { color: colors.primary, fill: colors.primary } : undefined}
              />
            )}
            <span
              className={`font-semibold text-sm ${sc.header.titleColor} ${sc.fonts?.heading || ''}`}
              style={useColorsProp ? { color: colors.primary } : undefined}
            >
              {designStyle === 4 ? 'FEEDBACK' : 'Your Feedback'}
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
            id="feedback-title"
            className={`${sc.content.titleClasses} ${sc.fonts?.heading || ''}`}
            style={useColorsProp ? { color: colors.text } : undefined}
          >
            {designStyle === 4 ? copy.title.toUpperCase() : copy.title}
          </h2>

          {/* Subtext */}
          <p className={sc.content.subtitleClasses} style={useColorsProp ? { color: colors.text, opacity: 0.7 } : undefined}>
            {copy.subtitle}
          </p>

          {/* Option List */}
          <div className={designStyle === 2 ? 'space-y-2' : 'space-y-3'}>
            {displayOptions.map((option) => {
              const isSelected = selectedOption === option.id;
              const optionStyle = isSelected ? sc.option.selected : sc.option.default;

              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={`w-full flex items-center gap-3 p-4 ${'borderRadius' in optionStyle ? optionStyle.borderRadius : ''} ${optionStyle.border} ${optionStyle.background} ${optionStyle.textColor} ${isSelected && 'shadow' in optionStyle && optionStyle.shadow ? optionStyle.shadow : ''} ${isSelected && 'transform' in optionStyle && optionStyle.transform ? optionStyle.transform : ''} transition-all text-left ${sc.fonts?.body || ''}`}
                  style={useColorsProp ? {
                    backgroundColor: isSelected ? colors.background : 'white',
                    borderColor: isSelected ? colors.primary : '#e5e7eb',
                    borderWidth: '2px',
                  } : undefined}
                  aria-pressed={isSelected}
                >
                  {/* Letter Badge */}
                  {showLetterBadge && (
                    <span
                      className={`flex items-center justify-center w-7 h-7 ${designStyle === 4 ? '' : 'rounded-full'} text-sm font-semibold ${
                        isSelected
                          ? `${sc.option.selected.letterBadge.background} ${sc.option.selected.letterBadge.textColor}`
                          : `${sc.option.default.letterBadge.background} ${sc.option.default.letterBadge.textColor} ${sc.option.default.letterBadge.border}`
                      }`}
                      style={useColorsProp ? {
                        backgroundColor: isSelected ? colors.primary : 'white',
                        color: isSelected ? 'white' : '#6b7280',
                        border: isSelected ? 'none' : '1px solid #e5e7eb',
                      } : undefined}
                    >
                      {option.letter}
                    </span>
                  )}

                  {/* Label */}
                  <span className={`flex-1 ${designStyle === 4 ? 'font-bold' : 'font-medium'}`} style={useColorsProp ? { color: colors.text } : undefined}>
                    {option.label}
                  </span>

                  {/* Checkmark for selected */}
                  {isSelected && designStyle !== 4 && (
                    <Check
                      className={`h-5 w-5 ${sc.isDark ? 'text-purple-400' : ''}`}
                      style={useColorsProp ? { color: colors.primary } : undefined}
                    />
                  )}
                </button>
              );
            })}

            {/* Other Option - always last when enabled */}
            {allowOtherOption && (
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedOption('other')}
                  className={`w-full flex items-center gap-3 p-4 ${sc.option.default.borderRadius} ${
                    selectedOption === 'other' ? `${sc.option.selected.border} ${sc.option.selected.background}` : `${sc.option.default.border} ${sc.option.default.background}`
                  } ${selectedOption === 'other' && sc.option.selected.shadow ? sc.option.selected.shadow : ''} ${selectedOption === 'other' && sc.option.selected.transform ? sc.option.selected.transform : ''} transition-all text-left`}
                  style={useColorsProp ? {
                    backgroundColor: selectedOption === 'other' ? colors.background : 'white',
                    borderColor: selectedOption === 'other' ? colors.primary : '#e5e7eb',
                    borderWidth: '2px',
                  } : undefined}
                  aria-pressed={selectedOption === 'other'}
                >
                  {/* Letter Badge */}
                  {showLetterBadge && (
                    <span
                      className={`flex items-center justify-center w-7 h-7 ${designStyle === 4 ? '' : 'rounded-full'} text-sm font-semibold ${
                        selectedOption === 'other'
                          ? `${sc.option.selected.letterBadge.background} ${sc.option.selected.letterBadge.textColor}`
                          : `${sc.option.default.letterBadge.background} ${sc.option.default.letterBadge.textColor} ${sc.option.default.letterBadge.border}`
                      }`}
                      style={useColorsProp ? {
                        backgroundColor: selectedOption === 'other' ? colors.primary : 'white',
                        color: selectedOption === 'other' ? 'white' : '#6b7280',
                        border: selectedOption === 'other' ? 'none' : '1px solid #e5e7eb',
                      } : undefined}
                    >
                      {otherOptionLetter}
                    </span>
                  )}

                  {/* Label */}
                  <span className={`flex-1 ${designStyle === 4 ? 'font-bold' : 'font-medium'} ${sc.option.default.textColor}`} style={useColorsProp ? { color: colors.text } : undefined}>
                    Other reason
                  </span>

                  {/* Checkmark for selected */}
                  {selectedOption === 'other' && designStyle !== 4 && (
                    <Check className={`h-5 w-5 ${sc.isDark ? 'text-purple-400' : ''}`} style={useColorsProp ? { color: colors.primary } : undefined} />
                  )}
                </button>

                {/* Text input for Other option */}
                {selectedOption === 'other' && (
                  <textarea
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder="Please tell us more..."
                    className={`w-full px-4 py-3 ${sc.option.default.borderRadius} border text-sm resize-none focus:outline-none focus:ring-2 ${sc.isDark ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-white'}`}
                    style={useColorsProp ? {
                      borderColor: '#e5e7eb',
                      backgroundColor: 'white',
                      color: colors.text,
                    } : undefined}
                    rows={3}
                    autoFocus
                  />
                )}
              </div>
            )}
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
              onClick={handleNext}
              disabled={isNextDisabled}
              className={`${sc.footer.primaryButton} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {designStyle === 4 ? 'NEXT →' : 'Next'}
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
            {displayOptions.map((option) => {
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

            {/* Other Option - always last when enabled */}
            {allowOtherOption && (
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedOption('other')}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left ${
                    selectedOption === 'other'
                      ? 'bg-[#F3E8FF] border-[#9333EA] border-2'
                      : 'bg-[#F3E8FF] border-[#E9D5FF] hover:border-[#D8B4FE]'
                  }`}
                  aria-pressed={selectedOption === 'other'}
                >
                  {/* Letter Badge */}
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                      selectedOption === 'other'
                        ? 'bg-[#9333EA] text-white'
                        : 'bg-white text-gray-600 border border-[#E9D5FF]'
                    }`}
                  >
                    {otherOptionLetter}
                  </span>

                  {/* Label */}
                  <span className="flex-1 font-medium text-gray-800">
                    Other reason
                  </span>

                  {/* Checkmark for selected */}
                  {selectedOption === 'other' && (
                    <Check className="h-5 w-5 text-[#9333EA]" />
                  )}
                </button>

                {/* Text input for Other option */}
                {selectedOption === 'other' && (
                  <textarea
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder="Please tell us more..."
                    className="w-full px-4 py-3 rounded-lg border border-[#E9D5FF] bg-white text-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#9333EA]"
                    rows={3}
                    autoFocus
                  />
                )}
              </div>
            )}
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
              disabled={isNextDisabled}
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
