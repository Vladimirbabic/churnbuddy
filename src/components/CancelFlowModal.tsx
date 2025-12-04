'use client';

import React, { useState, useCallback } from 'react';
import { YourFeedbackModal } from './modals/YourFeedbackModal';
import { ConsiderOtherPlansModal } from './modals/ConsiderOtherPlansModal';
import { SpecialOfferModal } from './modals/SpecialOfferModal';

interface Plan {
  id: string;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  period: string;
  highlights: string[];
}

interface FeedbackOption {
  id: string;
  label: string;
  letter: string;
}

interface DiscountResult {
  success: boolean;
  error?: string;
  message?: string;
  discountApplied?: boolean;
}

interface CancelFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancelConfirmed: (reason: string, feedback?: string) => void | Promise<void>;
  onOfferAccepted: () => void | Promise<void>;
  onOfferFailed?: (error: string, message: string) => void;
  onPlanSwitched?: (planId: string) => void | Promise<void>;
  customerId: string;
  subscriptionId: string;
  discountPercent?: number;
  discountDuration?: string;
  companyName?: string;
  apiEndpoint?: string;
  // Customization options
  feedbackOptions?: FeedbackOption[];
  alternativePlans?: Plan[];
  planDiscountPercent?: number;
}

const DEFAULT_FEEDBACK_OPTIONS: FeedbackOption[] = [
  { id: 'too_expensive', label: 'Too expensive for what I get', letter: 'A' },
  { id: 'not_using', label: "I'm not using it enough", letter: 'B' },
  { id: 'missing_features', label: 'Missing features I need', letter: 'C' },
  { id: 'found_alternative', label: 'Found a better alternative', letter: 'D' },
  { id: 'other', label: 'Other reason', letter: 'E' },
];

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    originalPrice: 29,
    discountedPrice: 5.80,
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
    discountedPrice: 15.80,
    period: '/mo',
    highlights: [
      '25 projects',
      'Advanced analytics',
      'Priority support',
      '10GB storage',
    ],
  },
];

type FlowStep = 'feedback' | 'plans' | 'offer' | 'closed';

export function CancelFlowModal({
  isOpen,
  onClose,
  onCancelConfirmed,
  onOfferAccepted,
  onOfferFailed,
  onPlanSwitched,
  customerId,
  subscriptionId,
  discountPercent = 50,
  discountDuration = '3 months',
  companyName = 'our service',
  apiEndpoint = '/api/cancel-flow',
  feedbackOptions = DEFAULT_FEEDBACK_OPTIONS,
  alternativePlans = DEFAULT_PLANS,
  planDiscountPercent = 80,
}: CancelFlowModalProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('feedback');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  // Reset flow when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep('feedback');
      setSelectedReason('');
      setIsProcessing(false);
      setError(null);
    }
  }, [isOpen]);

  const logEvent = async (eventType: string, details: Record<string, unknown>): Promise<DiscountResult | null> => {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          customerId,
          subscriptionId,
          details,
        }),
      });
      const data = await response.json();
      return data as DiscountResult;
    } catch (err) {
      console.error('Failed to log cancel flow event:', err);
      return null;
    }
  };

  const handleClose = useCallback(() => {
    setCurrentStep('feedback');
    setSelectedReason('');
    setIsProcessing(false);
    onClose();
  }, [onClose]);

  // Step 1: Feedback -> Step 2: Plans
  const handleFeedbackNext = async (reason: string) => {
    setSelectedReason(reason);
    await logEvent('feedback_submitted', { reason });
    setCurrentStep('plans');
  };

  // Step 2: Plans - Switch plan
  const handleSwitchPlan = async (planId: string) => {
    setIsProcessing(true);
    await logEvent('plan_switched', {
      reason: selectedReason,
      newPlanId: planId,
      discountPercent: planDiscountPercent
    });

    if (onPlanSwitched) {
      await onPlanSwitched(planId);
    }

    setIsProcessing(false);
    handleClose();
  };

  // Step 2: Plans - Decline -> Step 3: Offer
  const handleDeclinePlans = async () => {
    await logEvent('plans_declined', { reason: selectedReason });
    setCurrentStep('offer');
  };

  // Step 3: Offer - Accept
  const handleAcceptOffer = async () => {
    setIsProcessing(true);
    setError(null);
    
    const result = await logEvent('offer_accepted', {
      reason: selectedReason,
      discountPercent,
      discountDuration
    });

    setIsProcessing(false);

    // Check if discount was successfully applied
    if (!result) {
      setError({
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.'
      });
      if (onOfferFailed) {
        onOfferFailed('connection_error', 'Unable to connect to the server');
      }
      return;
    }

    if (!result.success) {
      // Handle specific error types
      let errorTitle = 'Unable to Apply Discount';
      let errorMessage = result.message || 'Something went wrong. Please try again.';
      
      if (result.error === 'already_has_discount') {
        errorTitle = 'Discount Already Active';
        errorMessage = 'You already have an active discount on your subscription. Enjoy your savings!';
      } else if (result.error === 'missing_subscription') {
        errorTitle = 'No Subscription Found';
        errorMessage = 'We couldn\'t find an active subscription. Please contact support.';
      } else if (result.error === 'stripe_not_configured') {
        errorTitle = 'Service Unavailable';
        errorMessage = 'The payment system is not configured. Please contact support.';
      }
      
      setError({ title: errorTitle, message: errorMessage });
      if (onOfferFailed) {
        onOfferFailed(result.error || 'unknown_error', errorMessage);
      }
      return;
    }

    // Success! Discount was applied
    await onOfferAccepted();
    handleClose();
  };

  // Step 3: Offer - Decline (final cancel)
  const handleFinalDecline = async () => {
    setIsProcessing(true);
    await logEvent('cancellation_confirmed', {
      reason: selectedReason,
      offersDeclined: true
    });

    await onCancelConfirmed(selectedReason);
    setIsProcessing(false);
    handleClose();
  };

  // Back navigation
  const handleBackToFeedback = () => setCurrentStep('feedback');
  const handleBackToPlans = () => setCurrentStep('plans');

  if (!isOpen) return null;

  return (
    <>
      {/* Step 1: Feedback Survey */}
      <YourFeedbackModal
        isOpen={currentStep === 'feedback'}
        onClose={handleClose}
        onBack={handleClose}
        onNext={handleFeedbackNext}
        options={feedbackOptions}
      />

      {/* Step 2: Consider Other Plans */}
      <ConsiderOtherPlansModal
        isOpen={currentStep === 'plans'}
        onClose={handleClose}
        onBack={handleBackToFeedback}
        onDecline={handleDeclinePlans}
        onSwitchPlan={handleSwitchPlan}
        plans={alternativePlans}
      />

      {/* Step 3: Special Offer */}
      <SpecialOfferModal
        isOpen={currentStep === 'offer'}
        onClose={handleClose}
        onBack={handleBackToPlans}
        onDecline={handleFinalDecline}
        onAcceptOffer={handleAcceptOffer}
        discountPercent={discountPercent}
        discountDuration={discountDuration}
        isProcessing={isProcessing}
        error={error}
        onClearError={() => setError(null)}
      />
    </>
  );
}

export default CancelFlowModal;
