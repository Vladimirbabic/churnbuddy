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
    step: 'feedback',
    selectedReason: '',
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

      options.forEach(function(opt, idx) {
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

      html += '</div>';
      html += '<div class="cb-footer">';
      html += '<button class="cb-btn cb-btn-back-purple" onclick="ChurnBuddy.close()">' + (copy.feedbackBackButton || 'Back') + '</button>';
      html += '<button class="cb-btn cb-btn-primary-black" onclick="ChurnBuddy.nextStep()"' + (state.selectedReason ? '' : ' disabled') + '>' + (copy.feedbackNextButton || 'Next') + '</button>';
      html += '</div>';
      html += '</div>';
      html += '</div>';

    } else if (state.step === 'plans' && cfg.showPlans !== false) {
      var plans = cfg.alternativePlans || [];
      var copy = cfg.copy || {};
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
        html += '<div class="cb-plan">';
        html += '<div class="cb-plan-name">' + plan.name + '</div>';
        html += '<div class="cb-plan-price">';
        html += '<span class="cb-plan-price-old">$' + plan.originalPrice + '</span>';
        html += '<span class="cb-plan-price-new">$' + plan.discountedPrice.toFixed(2) + '</span>';
        html += '<span class="cb-plan-period">' + plan.period + '</span>';
        html += '</div>';
        html += '<div class="cb-plan-features">';
        html += '<div class="cb-plan-features-label">Highlights</div>';
        (plan.highlights || []).forEach(function(h) {
          html += '<div class="cb-plan-feature">' + h + '</div>';
        });
        html += '</div>';
        html += '<button class="cb-btn-plan" onclick="ChurnBuddy.selectPlan(\\'' + plan.id + '\\')">Switch Plan</button>';
        html += '</div>';
      });

      html += '</div>';
      html += '<div class="cb-footer">';
      html += '<button class="cb-btn cb-btn-back-gray" onclick="ChurnBuddy.goBack()">' + (copy.plansBackButton || 'Back') + '</button>';
      html += '<button class="cb-btn cb-btn-primary-black" onclick="ChurnBuddy.nextStep()">' + (copy.plansDeclineButton || 'Decline Offer') + '</button>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';

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
      state.selectedPlan = null;
      state.error = null;
      state.config = null;
      logEvent('cancellation_attempt', {});
      loadConfig();
    },

    close: function() {
      state.isOpen = false;
      stopCountdown();
      state.countdownSeconds = 581; // Reset timer
      render();
    },

    selectReason: function(reasonId) {
      state.selectedReason = reasonId;
      render();
    },

    selectPlan: function(planId) {
      var cfg = state.config || {};
      var plan = (cfg.alternativePlans || []).find(function(p) { return p.id === planId; });
      if (plan) {
        logEvent('plan_switched', { planId: planId, planName: plan.name });
        state.isOpen = false;
        render();
        if (state.onPlanSwitch) state.onPlanSwitch(plan);
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
      var next = getNextStep();
      if (next === 'done') {
        ChurnBuddy.confirmCancel();
      } else {
        if (state.step === 'feedback' && state.selectedReason) {
          logEvent('feedback_submitted', { reason: state.selectedReason });
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
      logEvent('subscription_canceled', {
        reason: state.selectedReason,
        offersDeclined: true
      });
      state.isOpen = false;
      render();
      // Only call onCancel if explicitly provided by the developer
      if (state.onCancel) {
        state.onCancel({
          reason: state.selectedReason,
          offersDeclined: true,
          subscriptionId: state.subscriptionId,
          customerId: state.customerId
        });
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
