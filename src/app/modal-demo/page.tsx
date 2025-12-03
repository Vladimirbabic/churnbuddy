'use client';

import React, { useState } from 'react';
import { RotateCcw, Heart, Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  ConsiderOtherPlansModal,
  YourFeedbackModal,
  SpecialOfferModal,
} from '@/components/modals';

type ModalType = 'plans' | 'feedback' | 'offer' | null;

export default function ModalDemoPage() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const openModal = (type: ModalType) => setActiveModal(type);
  const closeModal = () => setActiveModal(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/cancel-flows"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Cancel Flows
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Cancel Flow Modals Demo
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These modals are designed to reduce churn by offering alternatives,
              collecting feedback, and presenting special offers before a customer
              cancels their subscription.
            </p>
          </div>

          {/* Modal Triggers */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Consider Other Plans */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-[#F0F4FF] px-4 py-3 flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-[#606C80]" />
                <span className="font-semibold text-[#606C80]">
                  Consider Other Plans
                </span>
              </div>
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4">
                  Offer alternative plans at a discounted rate to retain customers
                  who may find the current plan too expensive.
                </p>
                <ul className="text-sm text-gray-500 space-y-1 mb-4">
                  <li>• Side-by-side plan comparison</li>
                  <li>• Strikethrough pricing</li>
                  <li>• Feature highlights</li>
                </ul>
                <button
                  onClick={() => openModal('plans')}
                  className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Preview Modal
                </button>
              </div>
            </div>

            {/* Your Feedback */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-[#F5F3FF] px-4 py-3 flex items-center gap-2">
                <Heart className="h-5 w-5 text-[#9333EA] fill-[#9333EA]" />
                <span className="font-semibold text-[#9333EA]">
                  Your Feedback
                </span>
              </div>
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4">
                  Collect valuable exit survey data to understand why customers
                  are leaving and improve your product.
                </p>
                <ul className="text-sm text-gray-500 space-y-1 mb-4">
                  <li>• Multiple choice options</li>
                  <li>• Letter-labeled responses</li>
                  <li>• Visual selection state</li>
                </ul>
                <button
                  onClick={() => openModal('feedback')}
                  className="w-full bg-[#9333EA] text-white font-medium py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Preview Modal
                </button>
              </div>
            </div>

            {/* Special Offer */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-[#FEF2F2] px-4 py-3 flex items-center gap-2">
                <Tag className="h-5 w-5 text-[#DC2626]" />
                <span className="font-semibold text-[#DC2626]">
                  Special Offer
                </span>
              </div>
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4">
                  Present a time-limited discount offer as a final attempt to
                  retain customers before they cancel.
                </p>
                <ul className="text-sm text-gray-500 space-y-1 mb-4">
                  <li>• Urgency messaging</li>
                  <li>• Clear discount display</li>
                  <li>• Prominent CTA button</li>
                </ul>
                <button
                  onClick={() => openModal('offer')}
                  className="w-full bg-red-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Preview Modal
                </button>
              </div>
            </div>
          </div>

          {/* Flow Sequence Demo */}
          <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Complete Cancel Flow Sequence
            </h2>
            <p className="text-gray-600 mb-6">
              In a typical cancel flow, these modals can be chained together in
              sequence to maximize retention opportunities:
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-[#F5F3FF] text-[#9333EA] px-4 py-2 rounded-full font-medium">
                <span className="w-6 h-6 rounded-full bg-[#9333EA] text-white text-sm flex items-center justify-center">
                  1
                </span>
                Feedback Survey
              </div>
              <span className="text-gray-400">→</span>
              <div className="flex items-center gap-2 bg-[#F0F4FF] text-[#606C80] px-4 py-2 rounded-full font-medium">
                <span className="w-6 h-6 rounded-full bg-[#606C80] text-white text-sm flex items-center justify-center">
                  2
                </span>
                Other Plans
              </div>
              <span className="text-gray-400">→</span>
              <div className="flex items-center gap-2 bg-[#FEF2F2] text-[#DC2626] px-4 py-2 rounded-full font-medium">
                <span className="w-6 h-6 rounded-full bg-[#DC2626] text-white text-sm flex items-center justify-center">
                  3
                </span>
                Special Offer
              </div>
            </div>
          </div>

          {/* Usage Example */}
          <div className="mt-8 bg-gray-900 rounded-2xl p-6 overflow-x-auto">
            <p className="text-gray-400 text-sm mb-4">Usage Example:</p>
            <pre className="text-sm text-emerald-400">
              <code>{`import {
  ConsiderOtherPlansModal,
  YourFeedbackModal,
  SpecialOfferModal
} from '@/components/modals';

// In your component
<YourFeedbackModal
  isOpen={showFeedback}
  onClose={() => setShowFeedback(false)}
  onBack={handleBack}
  onNext={(reason) => {
    console.log('Selected reason:', reason);
    setShowPlans(true);
  }}
/>

<ConsiderOtherPlansModal
  isOpen={showPlans}
  onClose={() => setShowPlans(false)}
  onBack={() => setShowFeedback(true)}
  onDecline={() => setShowOffer(true)}
  onSwitchPlan={(planId) => {
    console.log('Switching to plan:', planId);
  }}
/>

<SpecialOfferModal
  isOpen={showOffer}
  onClose={() => setShowOffer(false)}
  onBack={() => setShowPlans(true)}
  onDecline={handleFinalCancel}
  onAcceptOffer={handleAcceptOffer}
  discountPercent={50}
  discountDuration="3 months"
/>`}</code>
            </pre>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ConsiderOtherPlansModal
        isOpen={activeModal === 'plans'}
        onClose={closeModal}
        onBack={closeModal}
        onDecline={() => {
          closeModal();
          alert('Offer declined - proceeding to cancellation');
        }}
        onSwitchPlan={(planId) => {
          closeModal();
          alert(`Switched to plan: ${planId}`);
        }}
      />

      <YourFeedbackModal
        isOpen={activeModal === 'feedback'}
        onClose={closeModal}
        onBack={closeModal}
        onNext={(selectedOption) => {
          closeModal();
          alert(`Selected reason: ${selectedOption}`);
        }}
      />

      <SpecialOfferModal
        isOpen={activeModal === 'offer'}
        onClose={closeModal}
        onBack={closeModal}
        onDecline={() => {
          closeModal();
          alert('Offer declined - proceeding to cancellation');
        }}
        onAcceptOffer={() => {
          closeModal();
          alert('Offer accepted! Discount applied.');
        }}
      />
    </div>
  );
}
