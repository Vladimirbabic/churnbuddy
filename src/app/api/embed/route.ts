// =============================================================================
// Embeddable Cancel Flow Widget
// =============================================================================
// Serves a standalone JavaScript widget that can be embedded on any website.
// Fetches flow configuration from the API to match the configured modals.

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const flowId = searchParams.get('flow') || '';

  // Determine base URL - prefer auto-detection from request headers for portability
  let baseUrl: string;
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';

  if (forwardedHost) {
    baseUrl = `${proto}://${forwardedHost}`;
  } else if (host && !host.includes('localhost')) {
    baseUrl = `${proto}://${host}`;
  } else if (process.env.NEXT_PUBLIC_APP_URL) {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  } else if (host) {
    baseUrl = `http://${host}`;
  } else {
    baseUrl = request.nextUrl.origin;
  }

  // The embeddable JavaScript widget
  const script = `
(function() {
  'use strict';

  var CONFIG = {
    flowId: '${flowId}',
    configEndpoint: '${baseUrl}/api/flow-config?id=${flowId}',
    eventEndpoint: '${baseUrl}/api/cancel-flow',
    baseUrl: '${baseUrl}'
  };

  // Styles matching the actual modal designs exactly
  var STYLES = \`
    .cb-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      backdrop-filter: blur(4px);
      padding: 16px;
    }
    .cb-modal {
      background: white;
      border-radius: 16px;
      max-width: 448px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      position: relative;
    }
    .cb-modal.cb-modal-lg {
      max-width: 512px;
    }

    /* Header bar - matching React components */
    .cb-header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
    }
    .cb-header-bar-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cb-header-bar-left svg {
      width: 16px;
      height: 16px;
    }
    .cb-header-bar-title {
      font-weight: 600;
      font-size: 14px;
    }
    .cb-close {
      padding: 4px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .cb-close svg {
      width: 16px;
      height: 16px;
    }

    /* Feedback Step - Purple Theme */
    .cb-feedback .cb-header-bar {
      background: #F5F3FF;
    }
    .cb-feedback .cb-header-bar-left svg {
      color: #9333EA;
      fill: #9333EA;
    }
    .cb-feedback .cb-header-bar-title {
      color: #9333EA;
    }
    .cb-feedback .cb-close {
      color: #9333EA;
    }
    .cb-feedback .cb-close:hover {
      background: #EDE9FE;
    }
    .cb-content {
      padding: 16px 24px 24px;
    }
    .cb-feedback h2 {
      margin: 8px 0 0;
      font-size: 22px;
      font-weight: 700;
      color: #111827;
    }
    .cb-feedback .cb-subtitle {
      margin: 4px 0 24px;
      color: #4B5563;
      font-size: 14px;
    }
    .cb-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .cb-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border: 1px solid #E9D5FF;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      background: #F3E8FF;
      text-align: left;
    }
    .cb-option:hover {
      border-color: #D8B4FE;
    }
    .cb-option.selected {
      border-color: #9333EA;
      border-width: 2px;
      padding: 15px;
    }
    .cb-option-letter {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: white;
      border: 1px solid #E9D5FF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      color: #4B5563;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    .cb-option.selected .cb-option-letter {
      background: #9333EA;
      border-color: #9333EA;
      color: white;
    }
    .cb-option-text {
      flex: 1;
      font-size: 15px;
      font-weight: 500;
      color: #1F2937;
    }
    .cb-option-check {
      width: 20px;
      height: 20px;
      color: #9333EA;
      display: none;
    }
    .cb-option.selected .cb-option-check {
      display: block;
    }
    .cb-other-input {
      width: 100%;
      max-width: 100%;
      margin-top: 8px;
      padding: 12px 16px;
      border: 1px solid #E9D5FF;
      border-radius: 8px;
      background: white;
      color: #1F2937;
      font-size: 14px;
      resize: vertical;
      min-height: 80px;
      max-height: 200px;
      font-family: inherit;
      box-sizing: border-box;
    }
    .cb-other-input:focus {
      outline: none;
      border-color: #9333EA;
      box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.2);
    }
    .cb-other-input::placeholder {
      color: #9CA3AF;
    }
    .cb-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
    }
    .cb-btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .cb-btn-back-purple {
      background: #EDE9FE;
      color: #581C87;
    }
    .cb-btn-back-purple:hover {
      background: #DDD6FE;
    }
    .cb-btn-back-gray {
      background: #F3F4F6;
      color: #1F2937;
    }
    .cb-btn-back-gray:hover {
      background: #E5E7EB;
    }
    .cb-btn-primary-black {
      background: #000000;
      color: white;
      padding: 8px 24px;
    }
    .cb-btn-primary-black:hover {
      background: #1F2937;
    }
    .cb-btn-primary-black:disabled {
      background: #9CA3AF;
      cursor: not-allowed;
      opacity: 0.5;
    }

    /* Plans Step - Gray/Slate Theme */
    .cb-plans .cb-header-bar {
      background: #F0F4FF;
    }
    .cb-plans .cb-header-bar-left svg {
      color: #606C80;
    }
    .cb-plans .cb-header-bar-title {
      color: #606C80;
    }
    .cb-plans .cb-close {
      color: #606C80;
    }
    .cb-plans .cb-close:hover {
      background: #DBEAFE;
    }
    .cb-plans h2 {
      margin: 16px 0 0;
      font-size: 22px;
      font-weight: 700;
      color: #1F2D3D;
      text-align: center;
    }
    .cb-plans .cb-subtitle {
      margin: 8px 0 24px;
      color: #6B7280;
      font-size: 14px;
      text-align: center;
    }
    .cb-plans-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    @media (max-width: 480px) {
      .cb-plans-grid {
        grid-template-columns: 1fr;
      }
    }
    .cb-plan {
      border: 1px solid #F3F4F6;
      border-radius: 16px;
      padding: 16px;
      background: white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .cb-plan-name {
      font-weight: 600;
      font-size: 18px;
      color: #111827;
      margin-bottom: 8px;
    }
    .cb-plan-price {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 16px;
    }
    .cb-plan-price-old {
      font-size: 14px;
      color: #9CA3AF;
      text-decoration: line-through;
    }
    .cb-plan-price-new {
      font-size: 24px;
      font-weight: 700;
      color: #2563EB;
    }
    .cb-plan-period {
      font-size: 14px;
      color: #6B7280;
    }
    .cb-plan-features {
      margin-bottom: 16px;
    }
    .cb-plan-features-label {
      font-size: 10px;
      font-weight: 600;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .cb-plan-feature {
      font-size: 14px;
      color: #374151;
      margin-bottom: 4px;
    }
    .cb-btn-plan {
      width: 100%;
      background: #2563EB;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .cb-btn-plan:hover {
      background: #1D4ED8;
    }
    .cb-btn-plan:disabled {
      background: #93C5FD;
      cursor: not-allowed;
    }
    .cb-plan-discount-info {
      font-size: 12px;
      color: #6B7280;
      margin-bottom: 12px;
    }

    /* Success Screen */
    .cb-success-content {
      text-align: center;
      padding: 32px 24px !important;
    }
    .cb-success-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 16px;
      background: #DCFCE7;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cb-success-icon svg {
      width: 32px;
      height: 32px;
      color: #16A34A;
    }
    .cb-discount-note {
      font-size: 14px;
      color: #16A34A;
      font-weight: 500;
      margin-top: 8px;
    }
    .cb-btn-full {
      width: 100%;
      margin-top: 24px;
    }

    /* Offer Step - Red Theme */
    .cb-offer .cb-header-bar {
      background: #FEF2F2;
    }
    .cb-offer .cb-header-bar-left svg {
      color: #DC2626;
    }
    .cb-offer .cb-header-bar-title {
      color: #DC2626;
    }
    .cb-offer .cb-close {
      color: #DC2626;
    }
    .cb-offer .cb-close:hover {
      background: #FEE2E2;
    }
    .cb-offer h2 {
      margin: 8px 0 0;
      font-size: 22px;
      font-weight: 700;
      color: #111827;
    }
    .cb-offer .cb-subtitle {
      margin: 4px 0 24px;
      color: #4B5563;
      font-size: 14px;
    }
    .cb-offer-card {
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
    }
    .cb-offer-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .cb-offer-badge svg {
      width: 16px;
      height: 16px;
      color: #B91C1C;
    }
    .cb-offer-badge-text {
      font-size: 10px;
      font-weight: 700;
      color: #B91C1C;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .cb-offer-discount {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 16px;
    }
    .cb-btn-offer {
      width: 100%;
      background: #EF4444;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .cb-btn-offer:hover {
      background: #DC2626;
    }

    /* Loading state */
    .cb-loading {
      padding: 48px;
      text-align: center;
      color: #6B7280;
    }
    .cb-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #E5E7EB;
      border-top-color: #9333EA;
      border-radius: 50%;
      animation: cb-spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes cb-spin {
      to { transform: rotate(360deg); }
    }

    /* Error/Message state */
    .cb-message {
      padding: 24px;
      text-align: center;
    }
    .cb-message-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    .cb-message-icon.error {
      background: #FEE2E2;
      color: #DC2626;
    }
    .cb-message-icon.success {
      background: #D1FAE5;
      color: #059669;
    }
    .cb-message-icon.info {
      background: #DBEAFE;
      color: #2563EB;
    }
    .cb-message-icon svg {
      width: 24px;
      height: 24px;
    }
    .cb-message h3 {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 8px;
    }
    .cb-message p {
      font-size: 14px;
      color: #6B7280;
      margin: 0 0 16px;
    }
    .cb-message-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    /* Countdown Timer */
    .cb-countdown {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #FEF2F2;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .cb-countdown svg {
      width: 18px;
      height: 18px;
      color: #DC2626;
    }
    .cb-countdown-label {
      font-size: 13px;
      color: #991B1B;
      font-weight: 500;
    }
    .cb-countdown-time {
      font-size: 20px;
      font-weight: 700;
      color: #DC2626;
      letter-spacing: 0.05em;
    }
  \`;

  // State
  var state = {
    isOpen: false,
    isLoading: true,
    isProcessing: false,
    processingMessage: '',
    step: 'feedback',
    selectedReason: '',
    otherText: '',  // Text for "Other" feedback option
    selectedPlan: null,
    customerId: '',
    subscriptionId: '',
    customerEmail: '',  // Can use email for auto-lookup
    config: null,
    error: null,
    message: null,  // { type: 'error'|'success'|'info', title, text }
    onCancel: null,
    onSaved: null,
    onPlanSwitch: null,
    // Plan switch success state
    planSwitchSuccess: false,
    switchedPlan: null,
    // Discount overrides from data attributes
    discountPercentOverride: null,
    discountDurationOverride: null,
    // Countdown timer
    countdownSeconds: 581, // 9 minutes 41 seconds
    countdownInterval: null
  };

  // SVG Icons - matching Lucide icons used in React components
  var ICONS = {
    heart: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    rotateCcw: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    tag: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    clock: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    alertCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
    checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
  };

  function injectStyles() {
    if (document.getElementById('cb-styles')) return;
    var style = document.createElement('style');
    style.id = 'cb-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  // Inject dynamic color styles based on config
  function injectDynamicColors(cfg) {
    var existingDynamic = document.getElementById('cb-dynamic-styles');
    if (existingDynamic) existingDynamic.remove();

    var feedbackColors = cfg.feedbackColors || { primary: '#9333EA', background: '#F5F3FF', text: '#1F2937' };
    var plansColors = cfg.plansColors || { primary: '#2563EB', background: '#F0F4FF', text: '#1F2937' };
    var offerColors = cfg.offerColors || { primary: '#DC2626', background: '#FEF2F2', text: '#1F2937' };

    // Helper to create lighter/darker variants
    function hexToRgb(hex) {
      var result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 147, g: 51, b: 234 };
    }

    var fbRgb = hexToRgb(feedbackColors.primary);
    var plRgb = hexToRgb(plansColors.primary);
    var ofRgb = hexToRgb(offerColors.primary);

    var dynamicStyles = \`
      /* Feedback Step - Dynamic Colors (using !important to override design styles) */
      .cb-feedback .cb-header-bar {
        background: \${feedbackColors.background} !important;
      }
      .cb-feedback .cb-header-bar-left svg {
        color: \${feedbackColors.primary} !important;
        fill: \${feedbackColors.primary} !important;
      }
      .cb-feedback .cb-header-bar-title {
        color: \${feedbackColors.primary} !important;
      }
      .cb-feedback .cb-close {
        color: \${feedbackColors.primary} !important;
      }
      .cb-feedback .cb-close:hover {
        background: rgba(\${fbRgb.r}, \${fbRgb.g}, \${fbRgb.b}, 0.1) !important;
      }
      .cb-feedback .cb-option {
        border-color: rgba(\${fbRgb.r}, \${fbRgb.g}, \${fbRgb.b}, 0.3) !important;
        background: rgba(\${fbRgb.r}, \${fbRgb.g}, \${fbRgb.b}, 0.05) !important;
      }
      .cb-feedback .cb-option:hover {
        border-color: rgba(\${fbRgb.r}, \${fbRgb.g}, \${fbRgb.b}, 0.5) !important;
      }
      .cb-feedback .cb-option.selected {
        border-color: \${feedbackColors.primary} !important;
        background: rgba(\${fbRgb.r}, \${fbRgb.g}, \${fbRgb.b}, 0.1) !important;
      }
      .cb-feedback .cb-option.selected .cb-option-letter {
        background: \${feedbackColors.primary} !important;
        border-color: \${feedbackColors.primary} !important;
        color: white !important;
      }
      .cb-feedback .cb-option-check {
        color: \${feedbackColors.primary} !important;
      }
      .cb-feedback .cb-option-letter {
        border-color: rgba(\${fbRgb.r}, \${fbRgb.g}, \${fbRgb.b}, 0.3) !important;
      }
      .cb-feedback .cb-other-input {
        border-color: rgba(\${fbRgb.r}, \${fbRgb.g}, \${fbRgb.b}, 0.3) !important;
      }
      .cb-feedback .cb-other-input:focus {
        border-color: \${feedbackColors.primary} !important;
        box-shadow: 0 0 0 2px rgba(\${fbRgb.r}, \${fbRgb.g}, \${fbRgb.b}, 0.2) !important;
      }
      .cb-feedback .cb-btn-back-purple {
        background: rgba(\${fbRgb.r}, \${fbRgb.g}, \${fbRgb.b}, 0.1) !important;
        color: \${feedbackColors.primary} !important;
      }
      .cb-feedback .cb-btn-back-purple:hover {
        background: rgba(\${fbRgb.r}, \${fbRgb.g}, \${fbRgb.b}, 0.2) !important;
      }

      /* Plans Step - Dynamic Colors */
      .cb-plans .cb-header-bar {
        background: \${plansColors.background} !important;
      }
      .cb-plans .cb-header-bar-left svg {
        color: \${plansColors.primary} !important;
        fill: none !important;
        stroke: \${plansColors.primary} !important;
      }
      .cb-plans .cb-header-bar-title {
        color: \${plansColors.primary} !important;
      }
      .cb-plans .cb-close {
        color: \${plansColors.primary} !important;
      }
      .cb-plans .cb-close:hover {
        background: rgba(\${plRgb.r}, \${plRgb.g}, \${plRgb.b}, 0.1) !important;
      }
      .cb-plans .cb-plan-price-new {
        color: \${plansColors.primary} !important;
      }
      .cb-plans .cb-btn-plan {
        background: \${plansColors.primary} !important;
      }
      .cb-plans .cb-btn-plan:hover {
        background: \${plansColors.primary} !important;
        opacity: 0.9;
      }
      .cb-plans .cb-btn-plan:disabled {
        background: rgba(\${plRgb.r}, \${plRgb.g}, \${plRgb.b}, 0.5) !important;
      }
      .cb-plans .cb-btn-back-gray {
        background: rgba(\${plRgb.r}, \${plRgb.g}, \${plRgb.b}, 0.1) !important;
        color: \${plansColors.text} !important;
      }

      /* Offer Step - Dynamic Colors */
      .cb-offer .cb-header-bar {
        background: \${offerColors.background} !important;
      }
      .cb-offer .cb-header-bar-left svg {
        color: \${offerColors.primary} !important;
        fill: none !important;
        stroke: \${offerColors.primary} !important;
      }
      .cb-offer .cb-header-bar-title {
        color: \${offerColors.primary} !important;
      }
      .cb-offer .cb-close {
        color: \${offerColors.primary} !important;
      }
      .cb-offer .cb-close:hover {
        background: rgba(\${ofRgb.r}, \${ofRgb.g}, \${ofRgb.b}, 0.1) !important;
      }
      .cb-offer .cb-offer-card {
        background: \${offerColors.background} !important;
        border-color: rgba(\${ofRgb.r}, \${ofRgb.g}, \${ofRgb.b}, 0.3) !important;
      }
      .cb-offer .cb-offer-badge svg {
        color: \${offerColors.primary} !important;
      }
      .cb-offer .cb-offer-badge-text {
        color: \${offerColors.primary} !important;
      }
      .cb-offer .cb-btn-offer {
        background: \${offerColors.primary} !important;
      }
      .cb-offer .cb-btn-offer:hover {
        background: \${offerColors.primary} !important;
        opacity: 0.9;
      }
      .cb-offer .cb-countdown svg {
        color: \${offerColors.primary} !important;
      }
      .cb-offer .cb-countdown-label {
        color: \${offerColors.primary} !important;
      }
      .cb-offer .cb-countdown-time {
        color: \${offerColors.primary} !important;
      }
      .cb-offer .cb-countdown {
        background: \${offerColors.background} !important;
      }
      .cb-offer .cb-btn-back-gray {
        background: rgba(\${ofRgb.r}, \${ofRgb.g}, \${ofRgb.b}, 0.1) !important;
        color: \${offerColors.text} !important;
      }
    \`;

    var style = document.createElement('style');
    style.id = 'cb-dynamic-styles';
    style.textContent = dynamicStyles;
    document.head.appendChild(style);
  }

  // Inject design style-specific CSS based on config.designStyle
  function injectDesignStyles(cfg) {
    var existingDesign = document.getElementById('cb-design-styles');
    if (existingDesign) existingDesign.remove();

    var designStyle = cfg.designStyle || 1;
    var designStyles = '';

    // Design style configurations
    var DESIGN_CONFIGS = {
      // Style 1: Classic Card (Default) - already the base styles
      1: {},
      
      // Style 2: Minimal Flat
      2: {
        modal: 'border-radius: 0; border: 1px solid #e5e7eb; box-shadow: none;',
        header: 'background: transparent !important; border-bottom: 1px solid #f3f4f6; padding: 20px 24px;',
        headerTitle: 'color: #9ca3af !important;',
        headerIcon: 'color: #9ca3af !important; fill: none !important;',
        closeBtn: 'color: #9ca3af;',
        content: 'padding: 24px;',
        title: 'font-size: 24px; font-weight: 300; margin-bottom: 4px;',
        subtitle: 'color: #9ca3af;',
        option: 'border-radius: 0; background: white; border: 1px solid #e5e7eb;',
        optionSelected: 'background: #f9fafb; border-color: #111827;',
        optionLetter: 'display: none;',
        backBtn: 'background: transparent; color: #6b7280; border: none;',
        primaryBtn: 'border-radius: 0; background: #111827;',
      },
      
      // Style 3: Glassmorphism
      3: {
        overlay: 'background: rgba(0, 0, 0, 0.3);',
        modal: 'border-radius: 24px; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5);',
        header: 'background: linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1)) !important; border-radius: 24px 24px 0 0;',
        headerTitle: 'color: #374151 !important;',
        headerIcon: 'color: white !important; fill: white !important; background: linear-gradient(to bottom right, #8b5cf6, #a855f7); padding: 6px; border-radius: 8px;',
        closeBtn: 'width: 32px; height: 32px; border-radius: 50%; background: rgba(255, 255, 255, 0.5); display: flex; align-items: center; justify-content: center;',
        title: 'font-weight: 700; background: linear-gradient(to right, #7c3aed, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;',
        option: 'border-radius: 16px; background: rgba(255, 255, 255, 0.5); border: 2px solid transparent;',
        optionSelected: 'background: rgba(139, 92, 246, 0.1); border-color: #8b5cf6; box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.2);',
        optionLetter: 'background: #e5e7eb; color: #6b7280;',
        optionLetterSelected: 'background: linear-gradient(to bottom right, #8b5cf6, #a855f7); color: white;',
        backBtn: 'flex: 1; padding: 12px; border-radius: 12px; background: rgba(255, 255, 255, 0.5); color: #6b7280;',
        primaryBtn: 'flex: 1; padding: 12px; border-radius: 12px; background: linear-gradient(to right, #8b5cf6, #a855f7); box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.3);',
        planBtn: 'background: linear-gradient(to right, #8b5cf6, #a855f7);',
        offerBtn: 'background: linear-gradient(to right, #8b5cf6, #a855f7);',
      },
      
      // Style 4: Brutalist
      4: {
        modal: 'border-radius: 0; border: 4px solid black; box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);',
        header: 'background: #fbbf24 !important; border-bottom: 4px solid black; padding: 12px 16px;',
        headerTitle: 'color: black !important; font-weight: 900; text-transform: uppercase;',
        headerIcon: 'color: black !important; fill: none !important;',
        closeBtn: 'width: 32px; height: 32px; background: white; border: 2px solid black; display: flex; align-items: center; justify-content: center; border-radius: 0;',
        title: 'font-size: 24px; font-weight: 900; text-transform: uppercase;',
        option: 'border-radius: 0; border: 3px solid black; background: white;',
        optionSelected: 'background: #bef264; box-shadow: 4px 4px 0px 0px rgba(0,0,0,1); transform: translate(-2px, -2px);',
        optionLetter: 'background: white; color: black; border: 2px solid black; border-radius: 0;',
        optionLetterSelected: 'background: black; color: #bef264;',
        backBtn: 'border-radius: 0; background: white; border: 3px solid black; color: black; font-weight: 900; text-transform: uppercase;',
        primaryBtn: 'border-radius: 0; background: black; border: 3px solid black; font-weight: 900; text-transform: uppercase;',
        planBtn: 'border-radius: 0; background: black; border: 3px solid black; font-weight: 900;',
        offerBtn: 'border-radius: 0; background: black; border: 3px solid black; font-weight: 900;',
        plan: 'border-radius: 0; border: 3px solid black;',
        offerCard: 'border-radius: 0; border: 3px solid black;',
      },
      
      // Style 5: Dark Mode
      5: {
        overlay: 'background: rgba(0, 0, 0, 0.7);',
        modal: 'background: #111827; border: 1px solid #374151;',
        header: 'background: transparent !important; border-bottom: 1px solid #374151;',
        headerTitle: 'color: white !important;',
        headerIcon: 'color: white !important; fill: white !important; background: linear-gradient(to bottom right, #a855f7, #ec4899); padding: 6px; border-radius: 8px;',
        closeBtn: 'color: #6b7280;',
        content: 'background: #111827;',
        title: 'color: white;',
        subtitle: 'color: #9ca3af;',
        option: 'background: rgba(55, 65, 81, 0.5); border: 1px solid #374151; color: #e5e7eb;',
        optionSelected: 'background: rgba(168, 85, 247, 0.2); border-color: #a855f7;',
        optionText: 'color: #e5e7eb;',
        optionLetter: 'background: #374151; color: #9ca3af;',
        optionLetterSelected: 'background: #a855f7; color: white;',
        backBtn: 'background: #374151; color: #9ca3af; border-radius: 12px;',
        primaryBtn: 'background: linear-gradient(to right, #a855f7, #ec4899); border-radius: 12px;',
        planBtn: 'background: linear-gradient(to right, #a855f7, #ec4899);',
        offerBtn: 'background: linear-gradient(to right, #a855f7, #ec4899);',
        plan: 'background: #1f2937; border-color: #374151;',
        planName: 'color: white;',
        planFeature: 'color: #d1d5db;',
        offerCard: 'background: #1f2937; border-color: #374151;',
        countdown: 'background: #1f2937;',
      },
      
      // Style 6: Soft Rounded
      6: {
        modal: 'border-radius: 32px; box-shadow: 0 20px 25px -5px rgba(236, 72, 153, 0.2);',
        header: 'background: linear-gradient(to right, #fce7f3, #f3e8ff) !important; border-radius: 32px 32px 0 0;',
        headerTitle: 'color: #7e22ce !important;',
        headerIcon: 'color: white !important; fill: white !important; background: linear-gradient(to bottom right, #f472b6, #c084fc); padding: 6px; border-radius: 8px;',
        closeBtn: 'width: 32px; height: 32px; border-radius: 50%; background: rgba(255, 255, 255, 0.8); color: #c084fc;',
        option: 'border-radius: 16px; background: rgba(168, 85, 247, 0.05); border: 2px solid transparent;',
        optionSelected: 'background: linear-gradient(to right, #fce7f3, #f3e8ff); border-color: #c084fc;',
        optionLetter: 'background: white; color: #9333ea; border: 2px solid #e9d5ff;',
        optionLetterSelected: 'background: linear-gradient(to bottom right, #f472b6, #c084fc); color: white; border: none;',
        backBtn: 'border-radius: 16px; background: #f3f4f6; color: #6b7280; padding: 12px 24px;',
        primaryBtn: 'border-radius: 16px; background: linear-gradient(to right, #f472b6, #a855f7); padding: 12px;',
        planBtn: 'border-radius: 16px; background: linear-gradient(to right, #f472b6, #a855f7);',
        offerBtn: 'border-radius: 16px; background: linear-gradient(to right, #f472b6, #a855f7);',
        plan: 'border-radius: 20px;',
        offerCard: 'border-radius: 20px;',
      },
      
      // Style 7: Corporate
      7: {
        modal: 'border-radius: 0; border: 1px solid #e2e8f0;',
        header: 'background: #0f172a !important; border-radius: 0;',
        headerTitle: 'color: white !important;',
        headerIcon: 'color: white !important; fill: none !important;',
        closeBtn: 'color: #94a3b8;',
        option: 'border-radius: 0; background: #f8fafc; border: 1px solid #e2e8f0;',
        optionSelected: 'background: #eff6ff; border: 2px solid #2563eb;',
        optionLetter: 'background: #e2e8f0; color: #64748b; border-radius: 0;',
        optionLetterSelected: 'background: #2563eb; color: white;',
        backBtn: 'border-radius: 0; border: 1px solid #cbd5e1; background: transparent; color: #64748b;',
        primaryBtn: 'border-radius: 0; background: #2563eb;',
        planBtn: 'border-radius: 0; background: #2563eb;',
        offerBtn: 'border-radius: 0; background: #2563eb;',
        plan: 'border-radius: 0;',
        offerCard: 'border-radius: 0;',
      },
      
      // Style 8: Playful
      8: {
        modal: 'border-radius: 24px;',
        header: 'background: linear-gradient(to right, #ec4899, #8b5cf6, #06b6d4) !important; border-radius: 24px 24px 0 0;',
        headerTitle: 'color: white !important;',
        headerIcon: 'color: white !important; fill: white !important;',
        closeBtn: 'width: 32px; height: 32px; border-radius: 50%; background: rgba(255, 255, 255, 0.2); color: white;',
        option: 'border-radius: 16px; background: #f9fafb; border: 2px solid transparent;',
        optionSelected: 'background: linear-gradient(to right, #fce7f3, #f3e8ff); border-color: #c084fc;',
        optionLetter: 'background: linear-gradient(to bottom right, #fbcfe8, #e9d5ff); color: #7e22ce;',
        optionLetterSelected: 'background: linear-gradient(to bottom right, #ec4899, #8b5cf6); color: white;',
        backBtn: 'border-radius: 12px; background: #f3f4f6; color: #6b7280; padding: 12px 20px;',
        primaryBtn: 'border-radius: 12px; background: linear-gradient(to right, #ec4899, #8b5cf6, #06b6d4); font-weight: 700;',
        planBtn: 'background: linear-gradient(to right, #ec4899, #8b5cf6, #06b6d4);',
        offerBtn: 'background: linear-gradient(to right, #ec4899, #8b5cf6, #06b6d4);',
      },
      
      // Style 9: Elegant Serif
      9: {
        modal: 'background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);',
        header: 'background: #f5f5f4 !important; border-bottom: 1px solid #e7e5e4;',
        headerTitle: 'color: #78716c !important; font-family: Georgia, serif;',
        headerIcon: 'color: #78716c !important; fill: none !important;',
        closeBtn: 'color: #a8a29e;',
        title: 'font-family: Georgia, serif; font-weight: normal;',
        option: 'border-radius: 6px; background: white; border: 1px solid #e7e5e4;',
        optionSelected: 'background: #fffbeb; border: 2px solid #d97706;',
        optionLetter: 'background: #f5f5f4; color: #78716c; border: 1px solid #d6d3d1;',
        optionLetterSelected: 'background: #d97706; color: white; border: none;',
        backBtn: 'border-radius: 6px; border: 1px solid #d6d3d1; background: transparent; color: #78716c;',
        primaryBtn: 'border-radius: 6px; background: #292524;',
        planBtn: 'border-radius: 6px; background: #292524;',
        offerBtn: 'border-radius: 6px; background: #292524;',
        plan: 'border-radius: 6px; background: white;',
        offerCard: 'border-radius: 6px; background: white;',
      },
    };

    var config = DESIGN_CONFIGS[designStyle] || {};

    // Build CSS based on design config
    if (Object.keys(config).length > 0) {
      designStyles = '/* Design Style ' + designStyle + ' */\\n';
      
      if (config.overlay) designStyles += '.cb-overlay { ' + config.overlay + ' }\\n';
      if (config.modal) designStyles += '.cb-modal { ' + config.modal + ' }\\n';
      if (config.header) designStyles += '.cb-header-bar { ' + config.header + ' }\\n';
      if (config.headerTitle) designStyles += '.cb-header-bar-title { ' + config.headerTitle + ' }\\n';
      if (config.headerIcon) designStyles += '.cb-header-bar-left svg { ' + config.headerIcon + ' }\\n';
      if (config.closeBtn) designStyles += '.cb-close { ' + config.closeBtn + ' }\\n';
      if (config.content) designStyles += '.cb-content { ' + config.content + ' }\\n';
      if (config.title) designStyles += '.cb-feedback h2, .cb-plans h2, .cb-offer h2 { ' + config.title + ' }\\n';
      if (config.subtitle) designStyles += '.cb-subtitle { ' + config.subtitle + ' }\\n';
      if (config.option) designStyles += '.cb-option { ' + config.option + ' }\\n';
      if (config.optionSelected) designStyles += '.cb-option.selected { ' + config.optionSelected + ' }\\n';
      if (config.optionText) designStyles += '.cb-option-text { ' + config.optionText + ' }\\n';
      if (config.optionLetter) designStyles += '.cb-option-letter { ' + config.optionLetter + ' }\\n';
      if (config.optionLetterSelected) designStyles += '.cb-option.selected .cb-option-letter { ' + config.optionLetterSelected + ' }\\n';
      if (config.backBtn) designStyles += '.cb-btn-back-purple, .cb-btn-back-gray { ' + config.backBtn + ' }\\n';
      if (config.primaryBtn) designStyles += '.cb-btn-primary-black { ' + config.primaryBtn + ' }\\n';
      if (config.planBtn) designStyles += '.cb-btn-plan { ' + config.planBtn + ' }\\n';
      if (config.offerBtn) designStyles += '.cb-btn-offer { ' + config.offerBtn + ' }\\n';
      if (config.plan) designStyles += '.cb-plan { ' + config.plan + ' }\\n';
      if (config.planName) designStyles += '.cb-plan-name { ' + config.planName + ' }\\n';
      if (config.planFeature) designStyles += '.cb-plan-feature { ' + config.planFeature + ' }\\n';
      if (config.offerCard) designStyles += '.cb-offer-card { ' + config.offerCard + ' }\\n';
      if (config.countdown) designStyles += '.cb-countdown { ' + config.countdown + ' }\\n';
    }

    if (designStyles) {
      var designStyleEl = document.createElement('style');
      designStyleEl.id = 'cb-design-styles';
      designStyleEl.textContent = designStyles;
      document.head.appendChild(designStyleEl);
    }
  }

  function formatCountdown(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  function startCountdown() {
    // Clear any existing interval
    if (state.countdownInterval) {
      clearInterval(state.countdownInterval);
    }

    state.countdownInterval = setInterval(function() {
      state.countdownSeconds--;

      if (state.countdownSeconds <= 0) {
        // Reset timer when it expires
        state.countdownSeconds = 581; // 9:41
      }

      // Update timer display without full re-render
      var timerEl = document.getElementById('cb-countdown-time');
      if (timerEl) {
        timerEl.textContent = formatCountdown(state.countdownSeconds);
      }
    }, 1000);
  }

  function stopCountdown() {
    if (state.countdownInterval) {
      clearInterval(state.countdownInterval);
      state.countdownInterval = null;
    }
  }

  function logEvent(eventType, details) {
    fetch(CONFIG.eventEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: eventType,
        flowId: CONFIG.flowId,
        customerId: state.customerId,
        subscriptionId: state.subscriptionId,
        customerEmail: state.customerEmail,  // For auto-lookup
        details: details
      })
    }).catch(function(err) {
      console.error('ChurnBuddy: Failed to log event', err);
    });
  }

  function loadConfig() {
    state.isLoading = true;
    render();

    console.log('ChurnBuddy: Fetching config from', CONFIG.configEndpoint);
    fetch(CONFIG.configEndpoint)
      .then(function(res) {
        console.log('ChurnBuddy: Response status:', res.status);
        if (!res.ok) {
          throw new Error('Failed to fetch config: ' + res.status);
        }
        return res.json();
      })
      .then(function(config) {
        console.log('ChurnBuddy: Received config:', config);
        if (config.error) {
          console.error('ChurnBuddy: Config error:', config.error);
          state.error = config.error;
          state.isLoading = false;
          render();
          return;
        }
        // Apply discount overrides from data attributes if provided
        if (state.discountPercentOverride) {
          config.discountPercent = state.discountPercentOverride;
        }
        if (state.discountDurationOverride) {
          config.discountDuration = state.discountDurationOverride;
        }
        state.config = config;
        // Inject design styles first, then dynamic colors (with !important) override
        injectDesignStyles(config);
        injectDynamicColors(config);
        state.isLoading = false;
        // Determine first step based on config - default to true if undefined
        var showFeedback = config.showFeedback !== false;
        var showPlans = config.showPlans !== false;
        var showOffer = config.showOffer !== false;

        if (showFeedback) {
          state.step = 'feedback';
        } else if (showPlans) {
          state.step = 'plans';
        } else if (showOffer) {
          state.step = 'offer';
        }
        render();
      })
      .catch(function(err) {
        console.error('ChurnBuddy: Failed to load config', err);
        state.error = 'Failed to load configuration. Check flow ID.';
        state.isLoading = false;
        render();
      });
  }

  function getNextStep() {
    var cfg = state.config || {};
    if (state.step === 'feedback') {
      if (cfg.showPlans !== false) return 'plans';
      if (cfg.showOffer !== false) return 'offer';
      return 'done';
    }
    if (state.step === 'plans') {
      if (cfg.showOffer !== false) return 'offer';
      return 'done';
    }
    return 'done';
  }

  function render() {
    var container = document.getElementById('cb-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'cb-container';
      document.body.appendChild(container);
    }

    if (!state.isOpen) {
      container.innerHTML = '';
      return;
    }

    var cfg = state.config || {};
    var html = '<div class="cb-overlay" onclick="if(event.target===this)ChurnBuddy.close()">';
    html += '<div class="cb-modal">';

    if (state.isLoading) {
      html += '<div class="cb-loading"><div class="cb-spinner"></div>Loading...</div>';
    } else if (state.isProcessing) {
      html += '<div class="cb-loading"><div class="cb-spinner"></div>Applying discount...</div>';
    } else if (state.message) {
      // Show message (error, success, info)
      var iconMap = { error: ICONS.alertCircle, success: ICONS.checkCircle, info: ICONS.info };
      html += '<div class="cb-message">';
      html += '<div class="cb-message-icon ' + state.message.type + '">' + iconMap[state.message.type] + '</div>';
      html += '<h3>' + state.message.title + '</h3>';
      html += '<p>' + state.message.text + '</p>';
      html += '<div class="cb-message-actions">';
      if (state.message.type === 'success') {
        html += '<button class="cb-btn cb-btn-primary-black" onclick="ChurnBuddy.close()">Done</button>';
      } else if (state.message.type === 'info') {
        html += '<button class="cb-btn cb-btn-back-gray" onclick="ChurnBuddy.clearMessage()">Keep Subscription</button>';
      } else {
        html += '<button class="cb-btn cb-btn-back-gray" onclick="ChurnBuddy.clearMessage()">Try Again</button>';
        html += '<button class="cb-btn cb-btn-primary-black" onclick="ChurnBuddy.close()">Close</button>';
      }
      html += '</div>';
      html += '</div>';
    } else if (state.error) {
      html += '<div class="cb-loading" style="color: #DC2626;">Error: ' + state.error + '</div>';
    } else if (state.step === 'feedback' && cfg.showFeedback !== false) {
      var options = cfg.feedbackOptions || [];
      var copy = cfg.copy || {};
      html += '<div class="cb-feedback">';
      // Header bar matching YourFeedbackModal
      html += '<div class="cb-header-bar">';
      html += '<div class="cb-header-bar-left">' + ICONS.heart + '<span class="cb-header-bar-title">Your Feedback</span></div>';
      html += '<button class="cb-close" onclick="ChurnBuddy.close()">' + ICONS.x + '</button>';
      html += '</div>';
      html += '<div class="cb-content">';
      html += '<h2>' + (copy.feedbackTitle || 'Sorry to see you go.') + '</h2>';
      html += '<p class="cb-subtitle">' + (copy.feedbackSubtitle || 'Please be honest about why you\\'re leaving. It\\'s the only way we can improve.') + '</p>';
      html += '<div class="cb-options">';

      // Filter out any existing "other" option from the list
      var regularOptions = options.filter(function(opt) { return opt.id !== 'other'; });
      
      regularOptions.forEach(function(opt, idx) {
        var letter = opt.letter || String.fromCharCode(65 + idx);
        var selected = state.selectedReason === opt.id ? ' selected' : '';
        html += '<div class="cb-option' + selected + '" onclick="ChurnBuddy.selectReason(\\'' + opt.id + '\\')">';
        html += '<div class="cb-option-letter">' + letter + '</div>';
        html += '<div class="cb-option-text">' + opt.label + '</div>';
        if (state.selectedReason === opt.id) {
          html += '<div class="cb-option-check">' + ICONS.check + '</div>';
        }
        html += '</div>';
      });

      // Add "Other" option at the end if allowed
      var allowOther = cfg.allowOtherOption !== false;
      if (allowOther) {
        var otherLetter = String.fromCharCode(65 + regularOptions.length);
        var otherSelected = state.selectedReason === 'other' ? ' selected' : '';
        html += '<div class="cb-option' + otherSelected + '" onclick="ChurnBuddy.selectReason(\\'other\\')">';
        html += '<div class="cb-option-letter">' + otherLetter + '</div>';
        html += '<div class="cb-option-text">Other reason</div>';
        if (state.selectedReason === 'other') {
          html += '<div class="cb-option-check">' + ICONS.check + '</div>';
        }
        html += '</div>';
        
        // Show text input if "other" is selected
        if (state.selectedReason === 'other') {
          html += '<textarea class="cb-other-input" id="cb-other-text" placeholder="Please tell us more..." oninput="ChurnBuddy.setOtherText(this.value)">' + (state.otherText || '') + '</textarea>';
        }
      }

      html += '</div>';
      html += '<div class="cb-footer">';
      html += '<button class="cb-btn cb-btn-back-purple" onclick="ChurnBuddy.close()">' + (copy.feedbackBackButton || 'Back') + '</button>';
      // Disable Next if no reason selected, or if "other" selected but no text
      var isNextDisabled = !state.selectedReason || (state.selectedReason === 'other' && !state.otherText.trim());
      html += '<button class="cb-btn cb-btn-primary-black" onclick="ChurnBuddy.nextStep()"' + (isNextDisabled ? ' disabled' : '') + '>' + (copy.feedbackNextButton || 'Next') + '</button>';
      html += '</div>';
      html += '</div>';
      html += '</div>';

    } else if (state.step === 'plans' && cfg.showPlans !== false) {
      var plans = cfg.alternativePlans || [];
      var copy = cfg.copy || {};

      // Helper to calculate discounted price
      function getDiscountedPrice(originalPrice, discountPercent) {
        return (originalPrice * (1 - discountPercent / 100)).toFixed(2);
      }

      // Show success screen if plan was switched
      if (state.planSwitchSuccess && state.switchedPlan) {
        html += '<div class="cb-plans">';
        html += '<div class="cb-modal-lg">';
        html += '<div class="cb-header-bar">';
        html += '<div class="cb-header-bar-left">' + ICONS.check + '<span class="cb-header-bar-title">Plan Switched</span></div>';
        html += '<button class="cb-close" onclick="ChurnBuddy.close()">' + ICONS.x + '</button>';
        html += '</div>';
        html += '<div class="cb-content cb-success-content">';
        html += '<div class="cb-success-icon">' + ICONS.check + '</div>';
        html += '<h2>You\\'ve been switched to ' + state.switchedPlan.name + '!</h2>';
        html += '<p class="cb-subtitle">Your new plan is now active. You\\'ll see the prorated changes on your next invoice.</p>';
        if (state.switchedPlan.discountPercent) {
          html += '<p class="cb-discount-note">' + state.switchedPlan.discountPercent + '% discount applied for ' + (state.switchedPlan.discountDurationMonths || 3) + ' months.</p>';
        }
        html += '<button class="cb-btn cb-btn-primary-black cb-btn-full" onclick="ChurnBuddy.close()">Done</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
      } else {
        html += '<div class="cb-plans">';
        html += '<div class="cb-modal-lg">';
        // Header bar matching ConsiderOtherPlansModal
        html += '<div class="cb-header-bar">';
        html += '<div class="cb-header-bar-left">' + ICONS.rotateCcw + '<span class="cb-header-bar-title">Consider Other Plans</span></div>';
        html += '<button class="cb-close" onclick="ChurnBuddy.close()">' + ICONS.x + '</button>';
        html += '</div>';
        html += '<div class="cb-content">';
        html += '<h2>' + (copy.plansTitle || 'How about 80% off of one of our other plans? These aren\\'t public.') + '</h2>';
        html += '<p class="cb-subtitle">' + (copy.plansSubtitle || 'You\\'d keep all your history and settings and enjoy much of the same functionality at a lower rate.') + '</p>';
        html += '<div class="cb-plans-grid">';

        plans.forEach(function(plan) {
          var discountedPrice = plan.discountPercent ? getDiscountedPrice(plan.originalPrice, plan.discountPercent) : (plan.discountedPrice || plan.originalPrice).toFixed(2);
          html += '<div class="cb-plan">';
          html += '<div class="cb-plan-name">' + plan.name + '</div>';
          html += '<div class="cb-plan-price">';
          html += '<span class="cb-plan-price-old">$' + plan.originalPrice + '</span>';
          html += '<span class="cb-plan-price-new">$' + discountedPrice + '</span>';
          html += '<span class="cb-plan-period">' + plan.period + '</span>';
          html += '</div>';
          if (plan.discountPercent) {
            html += '<p class="cb-plan-discount-info">' + plan.discountPercent + '% off for ' + (plan.discountDurationMonths || 3) + ' months</p>';
          }
          html += '<div class="cb-plan-features">';
          html += '<div class="cb-plan-features-label">Highlights</div>';
          (plan.highlights || []).forEach(function(h) {
            html += '<div class="cb-plan-feature">' + h + '</div>';
          });
          html += '</div>';
          html += '<button class="cb-btn-plan" onclick="ChurnBuddy.selectPlan(\\'' + plan.id + '\\')"' + (state.isProcessing ? ' disabled' : '') + '>' + (state.isProcessing ? 'Switching...' : 'Switch Plan') + '</button>';
          html += '</div>';
        });

        html += '</div>';
        html += '<div class="cb-footer">';
        html += '<button class="cb-btn cb-btn-back-gray" onclick="ChurnBuddy.goBack()"' + (state.isProcessing ? ' disabled' : '') + '>' + (copy.plansBackButton || 'Back') + '</button>';
        html += '<button class="cb-btn cb-btn-primary-black" onclick="ChurnBuddy.nextStep()"' + (state.isProcessing ? ' disabled' : '') + '>' + (copy.plansDeclineButton || 'Decline Offer') + '</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
      }

    } else if (state.step === 'offer' && cfg.showOffer !== false) {
      var discountPct = cfg.discountPercent || 50;
      var discountDur = cfg.discountDuration || 3;
      var copy = cfg.copy || {};
      // Helper to replace {discount} and {duration} placeholders
      function replacePlaceholders(text) {
        return text.replace(/{discount}/g, discountPct).replace(/{duration}/g, discountDur);
      }
      html += '<div class="cb-offer">';
      // Header bar matching SpecialOfferModal
      html += '<div class="cb-header-bar">';
      html += '<div class="cb-header-bar-left">' + ICONS.tag + '<span class="cb-header-bar-title">Special Offer</span></div>';
      html += '<button class="cb-close" onclick="ChurnBuddy.close()">' + ICONS.x + '</button>';
      html += '</div>';
      html += '<div class="cb-content">';
      var offerTitle = copy.offerTitle || 'Stay to get {discount}% off for {duration} months. We\\'d hate to lose you.';
      html += '<h2>' + replacePlaceholders(offerTitle) + '</h2>';
      html += '<p class="cb-subtitle">' + (copy.offerSubtitle || 'You\\'re eligible for our special discount.') + '</p>';
      // Countdown timer
      html += '<div class="cb-countdown">';
      html += ICONS.clock;
      html += '<span class="cb-countdown-label">' + (copy.offerTimerLabel || 'Offer expires in') + '</span>';
      html += '<span class="cb-countdown-time" id="cb-countdown-time">' + formatCountdown(state.countdownSeconds) + '</span>';
      html += '</div>';
      html += '<div class="cb-offer-card">';
      html += '<div class="cb-offer-badge">' + ICONS.tag + '<span class="cb-offer-badge-text">' + (copy.offerBadgeText || 'Time-Limited Deal') + '</span></div>';
      var discountText = copy.offerDiscountText || '{discount}% off for {duration} months';
      html += '<div class="cb-offer-discount">' + replacePlaceholders(discountText) + '</div>';
      html += '<button class="cb-btn-offer" onclick="ChurnBuddy.acceptOffer()">' + (copy.offerAcceptButton || 'Accept This Offer') + '</button>';
      html += '</div>';
      html += '<div class="cb-footer">';
      html += '<button class="cb-btn cb-btn-back-gray" onclick="ChurnBuddy.goBack()">' + (copy.offerBackButton || 'Back') + '</button>';
      html += '<button class="cb-btn cb-btn-primary-black" onclick="ChurnBuddy.confirmCancel()">' + (copy.offerDeclineButton || 'Decline Offer') + '</button>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      // Start the countdown timer when on offer step
      setTimeout(startCountdown, 0);
    } else {
      // No steps enabled or done
      html += '<div class="cb-loading">No cancel flow configured</div>';
    }

    html += '</div></div>';
    container.innerHTML = html;
  }

  window.ChurnBuddy = {
    init: function(options) {
      injectStyles();
      state.customerId = options.customerId || '';
      state.subscriptionId = options.subscriptionId || '';
      state.customerEmail = options.customerEmail || '';  // Email for auto-lookup
      // Only set callbacks if explicitly provided - no default alerts
      state.onCancel = options.onCancel || null;
      state.onSaved = options.onSaved || null;
      state.onPlanSwitch = options.onPlanSwitch || null;
      // Store discount overrides from data attributes or init options
      state.discountPercentOverride = options.discountPercent || null;
      state.discountDurationOverride = options.discountDuration || null;

      // Log initialization for debugging
      console.log('ChurnBuddy initialized:', {
        customerId: state.customerId || '(not set)',
        subscriptionId: state.subscriptionId || '(not set)',
        customerEmail: state.customerEmail || '(not set)',
        mode: state.customerId ? 'Direct Stripe ID' : (state.customerEmail ? 'Email Lookup' : 'No customer data')
      });

      if (options.cancelButtonSelector) {
        document.querySelectorAll(options.cancelButtonSelector).forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            ChurnBuddy.open();
          });
        });
      }
    },

    open: function(options) {
      if (options) {
        state.customerId = options.customerId || state.customerId;
        state.subscriptionId = options.subscriptionId || state.subscriptionId;
        state.customerEmail = options.customerEmail || state.customerEmail;
      }
      
      // Warn developers if no customer data is provided
      if (!state.customerId && !state.subscriptionId && !state.customerEmail) {
        console.warn('ChurnBuddy: No customer data provided. Please set data-customer-id, data-subscription-id, or data-customer-email on the script tag, or pass them via ChurnBuddy.init() or ChurnBuddy.open()');
      } else if (!state.customerId && state.customerEmail) {
        console.log('ChurnBuddy: Using email for customer lookup:', state.customerEmail);
      }
      
      state.isOpen = true;
      state.selectedReason = '';
      state.otherText = '';
      state.selectedPlan = null;
      state.error = null;
      state.config = null;
      state.planSwitchSuccess = false;
      state.switchedPlan = null;
      state.isProcessing = false;
      logEvent('cancellation_attempt', {});
      loadConfig();
    },

    close: function() {
      state.isOpen = false;
      state.planSwitchSuccess = false;
      state.switchedPlan = null;
      stopCountdown();
      state.countdownSeconds = 581; // Reset timer
      render();
    },

    selectReason: function(reasonId) {
      state.selectedReason = reasonId;
      // Clear other text when selecting a different reason
      if (reasonId !== 'other') {
        state.otherText = '';
      }
      render();
    },

    setOtherText: function(text) {
      state.otherText = text;
      // Update button state without full re-render to avoid losing cursor position
      var nextBtn = document.querySelector('.cb-feedback .cb-btn-primary-black');
      if (nextBtn) {
        var isDisabled = !text.trim();
        nextBtn.disabled = isDisabled;
      }
    },

    selectPlan: function(planId) {
      var cfg = state.config || {};
      var plan = (cfg.alternativePlans || []).find(function(p) { return p.id === planId; });
      if (!plan) return;

      // Validate that we have the required data for plan switching
      if (!plan.stripePriceId) {
        state.message = {
          type: 'error',
          title: 'Plan Not Available',
          text: 'This plan is not configured for automatic switching. Please contact support.'
        };
        render();
        return;
      }

      if (!state.subscriptionId) {
        state.message = {
          type: 'error',
          title: 'Subscription Required',
          text: 'No subscription ID provided. Please ensure your cancel button includes data-subscription-id attribute.'
        };
        render();
        return;
      }

      // If plan has a Stripe price ID, call the switch-plan API
      if (plan.stripePriceId && state.subscriptionId) {
        state.isProcessing = true;
        state.processingMessage = 'Switching your plan...';
        render();

        fetch('${baseUrl}/api/cancel-flow/switch-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flowId: CONFIG.flowId,
            subscriptionId: state.subscriptionId,
            newPriceId: plan.stripePriceId,
            customerId: state.customerId,
            customerEmail: state.customerEmail,
            planName: plan.name,
            discountPercent: plan.discountPercent,
            discountDurationMonths: plan.discountDurationMonths || 3
          })
        })
        .then(function(response) {
          return response.json().then(function(data) {
            if (!response.ok) {
              var errorMsg = typeof data.error === 'string' ? data.error : (data.message || 'Failed to switch plan');
              throw new Error(errorMsg);
            }
            return data;
          });
        })
        .then(function(data) {
          state.isProcessing = false;
          state.planSwitchSuccess = true;
          state.switchedPlan = plan;
          render();
          logEvent('plan_switched', { planId: planId, planName: plan.name, stripePriceId: plan.stripePriceId });
          if (state.onPlanSwitch) state.onPlanSwitch(plan);
        })
        .catch(function(err) {
          state.isProcessing = false;
          state.message = {
            type: 'error',
            title: 'Switch Failed',
            text: err.message || 'Could not switch your plan. Please try again.'
          };
          render();
        });
      }
    },

    goBack: function() {
      var cfg = state.config || {};
      if (state.step === 'offer') {
        stopCountdown();
      }
      if (state.step === 'plans' && cfg.showFeedback !== false) {
        state.step = 'feedback';
      } else if (state.step === 'offer') {
        if (cfg.showPlans !== false) {
          state.step = 'plans';
        } else if (cfg.showFeedback !== false) {
          state.step = 'feedback';
        }
      }
      render();
    },

    nextStep: function() {
      // Validate "other" option requires text
      if (state.step === 'feedback' && state.selectedReason === 'other' && !state.otherText.trim()) {
        // Don't proceed without other text
        return;
      }
      
      var next = getNextStep();
      if (next === 'done') {
        ChurnBuddy.confirmCancel();
      } else {
        if (state.step === 'feedback' && state.selectedReason) {
          var details = { reason: state.selectedReason };
          if (state.selectedReason === 'other' && state.otherText) {
            details.otherText = state.otherText;
          }
          logEvent('feedback_submitted', details);
        }
        state.step = next;
        render();
      }
    },

    acceptOffer: function() {
      var cfg = state.config || {};
      state.isProcessing = true;
      render();

      // Call API to apply discount
      fetch(CONFIG.eventEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'offer_accepted',
          flowId: CONFIG.flowId,
          customerId: state.customerId,
          subscriptionId: state.subscriptionId,
          customerEmail: state.customerEmail,  // For auto-lookup
          details: {
            reason: state.selectedReason,
            discountPercent: cfg.discountPercent,
            discountDuration: cfg.discountDuration
          }
        })
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        state.isProcessing = false;
        if (data.error === 'already_has_discount') {
          // Customer already has a discount
          state.message = {
            type: 'info',
            title: 'Discount Already Active',
            text: 'You already have an active discount on your subscription. Enjoy your savings!'
          };
          render();
        } else if (data.success) {
          // Success - discount applied
          state.message = {
            type: 'success',
            title: 'Discount Applied!',
            text: 'Your ' + cfg.discountPercent + '% discount has been applied for the next ' + cfg.discountDuration + ' months.'
          };
          render();
          // Pass result data to callback
          if (state.onSaved) state.onSaved({
            success: true,
            discountApplied: true,
            discountPercent: cfg.discountPercent,
            discountDuration: cfg.discountDuration,
            couponId: data.discount?.couponId,
            subscriptionId: state.subscriptionId,
            customerId: state.customerId
          });
        } else {
          // Error - provide specific feedback
          var errorTitle = 'Something went wrong';
          var errorText = data.message || 'Failed to apply discount. Please try again or contact support.';
          
          if (data.error === 'customer_not_found') {
            errorTitle = 'Customer Not Found';
            errorText = 'We could not find your account in our billing system. Please contact support.';
          } else if (data.error === 'no_subscription') {
            errorTitle = 'No Active Subscription';
            errorText = 'You do not have an active subscription to apply a discount to.';
          } else if (data.error === 'discount_application_failed') {
            errorTitle = 'Unable to Apply Discount';
            errorText = 'There was an issue applying the discount to your subscription. Please contact support.';
          }
          
          state.message = {
            type: 'error',
            title: errorTitle,
            text: errorText
          };
          render();
          console.error('ChurnBuddy: Discount application failed:', data);
        }
      })
      .catch(function(err) {
        console.error('ChurnBuddy: Failed to apply offer', err);
        state.isProcessing = false;
        state.message = {
          type: 'error',
          title: 'Connection Error',
          text: 'Unable to connect. Please check your internet and try again.'
        };
        render();
      });
    },

    clearMessage: function() {
      state.message = null;
      render();
    },

    confirmCancel: function() {
      stopCountdown();
      var details = {
        reason: state.selectedReason,
        offersDeclined: true
      };
      if (state.selectedReason === 'other' && state.otherText) {
        details.otherText = state.otherText;
      }
      logEvent('subscription_canceled', details);
      state.isOpen = false;
      render();
      // Only call onCancel if explicitly provided by the developer
      if (state.onCancel) {
        var cancelData = {
          reason: state.selectedReason,
          offersDeclined: true,
          subscriptionId: state.subscriptionId,
          customerId: state.customerId
        };
        if (state.selectedReason === 'other' && state.otherText) {
          cancelData.otherText = state.otherText;
        }
        state.onCancel(cancelData);
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function() {
    var script = document.querySelector('script[data-churnbuddy]');
    if (script) {
      ChurnBuddy.init({
        customerId: script.getAttribute('data-customer-id') || '',
        subscriptionId: script.getAttribute('data-subscription-id') || '',
        customerEmail: script.getAttribute('data-customer-email') || '',
        cancelButtonSelector: script.getAttribute('data-cancel-selector') || '[data-cancel-subscription]',
        // Read discount overrides from data attributes
        discountPercent: parseInt(script.getAttribute('data-discount-percent')) || null,
        discountDuration: parseInt(script.getAttribute('data-discount-duration')) || null
      });
    }
  });
})();
`;

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      // No caching - changes apply immediately to all embedded sites
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
