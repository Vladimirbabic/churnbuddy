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

interface CancelFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancelConfirmed: (reason: string, feedback?: string) => void | Promise<void>;
  onOfferAccepted: () => void | Promise<void>;
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

  // Reset flow when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep('feedback');
      setSelectedReason('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  const logEvent = async (eventType: string, details: Record<string, unknown>) => {
    try {
      await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          customerId,
          subscriptionId,
          details,
        }),
      });
    } catch (err) {
      console.error('Failed to log cancel flow event:', err);
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
    await logEvent('offer_accepted', {
      reason: selectedReason,
      discountPercent,
      discountDuration
    });

    await onOfferAccepted();
    setIsProcessing(false);
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
      />
    </>
  );
}

export default CancelFlowModal;
