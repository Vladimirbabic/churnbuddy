// =============================================================================
// Embeddable Cancel Flow Widget
// =============================================================================
// Serves a standalone JavaScript widget that can be embedded on any website.
// Fetches flow configuration from the API to match the configured modals.

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const flowId = searchParams.get('flow') || '';

  // Determine base URL
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const host = request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';

    if (forwardedHost) {
      baseUrl = `${proto}://${forwardedHost}`;
    } else if (host) {
      baseUrl = `${proto}://${host}`;
    } else {
      baseUrl = request.nextUrl.origin;
    }
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

  // Styles matching the actual modal designs
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
    }
    .cb-modal {
      background: white;
      border-radius: 24px;
      max-width: 440px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      position: relative;
    }
    .cb-close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      font-size: 18px;
      z-index: 10;
      transition: background 0.2s;
    }
    .cb-close:hover {
      background: rgba(0, 0, 0, 0.1);
    }

    /* Feedback Step - Purple Theme */
    .cb-feedback .cb-header {
      padding: 32px 24px 24px;
      text-align: center;
    }
    .cb-feedback .cb-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #9333EA, #7C3AED);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    .cb-feedback .cb-icon svg {
      width: 32px;
      height: 32px;
      color: white;
    }
    .cb-feedback h2 {
      margin: 0 0 8px;
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
    }
    .cb-feedback .cb-subtitle {
      margin: 0;
      color: #6b7280;
      font-size: 15px;
    }
    .cb-content {
      padding: 0 24px 24px;
    }
    .cb-option {
      display: flex;
      align-items: center;
      padding: 14px 16px;
      margin-bottom: 10px;
      border: 2px solid #E5E7EB;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      background: white;
    }
    .cb-option:hover {
      border-color: #9333EA;
      background: #FAF5FF;
    }
    .cb-option.selected {
      border-color: #9333EA;
      background: #FAF5FF;
    }
    .cb-option-letter {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #F3E8FF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 13px;
      color: #9333EA;
      margin-right: 12px;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    .cb-option.selected .cb-option-letter {
      background: #9333EA;
      color: white;
    }
    .cb-option-text {
      flex: 1;
      font-size: 15px;
      color: #374151;
    }
    .cb-footer {
      padding: 0 24px 24px;
      display: flex;
      gap: 12px;
    }
    .cb-btn {
      flex: 1;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .cb-btn-secondary {
      background: #F3F4F6;
      color: #374151;
    }
    .cb-btn-secondary:hover {
      background: #E5E7EB;
    }
    .cb-btn-primary {
      background: #9333EA;
      color: white;
    }
    .cb-btn-primary:hover {
      background: #7C3AED;
    }
    .cb-btn-primary:disabled {
      background: #D1D5DB;
      cursor: not-allowed;
    }

    /* Plans Step - Gray/Slate Theme */
    .cb-plans .cb-header {
      padding: 32px 24px 24px;
      text-align: center;
    }
    .cb-plans .cb-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #475569, #64748B);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    .cb-plans h2 {
      margin: 0 0 8px;
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
    }
    .cb-plans-grid {
      display: flex;
      gap: 12px;
      padding: 0 24px 24px;
    }
    .cb-plan {
      flex: 1;
      border: 2px solid #E5E7EB;
      border-radius: 16px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s;
      background: white;
    }
    .cb-plan:hover {
      border-color: #475569;
      background: #F8FAFC;
    }
    .cb-plan-name {
      font-weight: 700;
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .cb-plan-price {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-bottom: 4px;
    }
    .cb-plan-price-old {
      font-size: 14px;
      color: #9CA3AF;
      text-decoration: line-through;
    }
    .cb-plan-price-new {
      font-size: 28px;
      font-weight: 700;
      color: #10B981;
    }
    .cb-plan-period {
      font-size: 14px;
      color: #6B7280;
    }
    .cb-plan-features {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #E5E7EB;
    }
    .cb-plan-feature {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #6B7280;
      margin-bottom: 6px;
    }
    .cb-plan-feature svg {
      width: 14px;
      height: 14px;
      color: #10B981;
      flex-shrink: 0;
    }
    .cb-btn-slate {
      background: #475569;
      color: white;
    }
    .cb-btn-slate:hover {
      background: #334155;
    }

    /* Offer Step - Red Theme */
    .cb-offer .cb-header {
      padding: 32px 24px 24px;
      text-align: center;
    }
    .cb-offer .cb-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #DC2626, #EF4444);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    .cb-offer h2 {
      margin: 0 0 8px;
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
    }
    .cb-offer-card {
      margin: 0 24px 24px;
      background: linear-gradient(135deg, #FEF2F2, #FEE2E2);
      border: 2px solid #FECACA;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
    }
    .cb-offer-badge {
      display: inline-block;
      background: #DC2626;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }
    .cb-offer-discount {
      font-size: 56px;
      font-weight: 800;
      color: #DC2626;
      line-height: 1;
      margin-bottom: 8px;
    }
    .cb-offer-duration {
      color: #6B7280;
      font-size: 16px;
    }
    .cb-btn-danger {
      background: white;
      color: #DC2626;
      border: 2px solid #FECACA;
    }
    .cb-btn-danger:hover {
      background: #FEF2F2;
    }
    .cb-btn-success {
      background: #DC2626;
      color: white;
    }
    .cb-btn-success:hover {
      background: #B91C1C;
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
  \`;

  // State
  var state = {
    isOpen: false,
    isLoading: true,
    step: 'feedback',
    selectedReason: '',
    selectedPlan: null,
    customerId: '',
    subscriptionId: '',
    config: null,
    onCancel: null,
    onSaved: null,
    onPlanSwitch: null
  };

  // SVG Icons
  var ICONS = {
    heart: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>',
    refresh: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>',
    tag: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>'
  };

  function injectStyles() {
    if (document.getElementById('cb-styles')) return;
    var style = document.createElement('style');
    style.id = 'cb-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
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
        details: details
      })
    }).catch(function(err) {
      console.error('ChurnBuddy: Failed to log event', err);
    });
  }

  function loadConfig() {
    state.isLoading = true;
    render();

    fetch(CONFIG.configEndpoint)
      .then(function(res) { return res.json(); })
      .then(function(config) {
        state.config = config;
        state.isLoading = false;
        // Determine first step based on config
        if (config.showFeedback) {
          state.step = 'feedback';
        } else if (config.showPlans) {
          state.step = 'plans';
        } else if (config.showOffer) {
          state.step = 'offer';
        }
        render();
      })
      .catch(function(err) {
        console.error('ChurnBuddy: Failed to load config', err);
        state.isLoading = false;
        render();
      });
  }

  function getNextStep() {
    var cfg = state.config || {};
    if (state.step === 'feedback') {
      if (cfg.showPlans) return 'plans';
      if (cfg.showOffer) return 'offer';
      return 'done';
    }
    if (state.step === 'plans') {
      if (cfg.showOffer) return 'offer';
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
    html += '<button class="cb-close" onclick="ChurnBuddy.close()">&times;</button>';

    if (state.isLoading) {
      html += '<div class="cb-loading"><div class="cb-spinner"></div>Loading...</div>';
    } else if (state.step === 'feedback' && cfg.showFeedback) {
      var options = cfg.feedbackOptions || [];
      html += '<div class="cb-feedback">';
      html += '<div class="cb-header">';
      html += '<div class="cb-icon">' + ICONS.heart + '</div>';
      html += '<h2>' + (cfg.headerTitle || 'Your Feedback') + '</h2>';
      html += '<p class="cb-subtitle">' + (cfg.headerDescription || 'Please help us improve') + '</p>';
      html += '</div>';
      html += '<div class="cb-content">';

      options.forEach(function(opt, idx) {
        var letter = opt.letter || String.fromCharCode(65 + idx);
        var selected = state.selectedReason === opt.id ? ' selected' : '';
        html += '<div class="cb-option' + selected + '" onclick="ChurnBuddy.selectReason(\\'' + opt.id + '\\')">';
        html += '<div class="cb-option-letter">' + letter + '</div>';
        html += '<div class="cb-option-text">' + opt.label + '</div>';
        html += '</div>';
      });

      html += '</div>';
      html += '<div class="cb-footer">';
      html += '<button class="cb-btn cb-btn-secondary" onclick="ChurnBuddy.close()">Keep Subscription</button>';
      html += '<button class="cb-btn cb-btn-primary" onclick="ChurnBuddy.nextStep()"' + (state.selectedReason ? '' : ' disabled') + '>Continue</button>';
      html += '</div>';
      html += '</div>';

    } else if (state.step === 'plans' && cfg.showPlans) {
      var plans = cfg.alternativePlans || [];
      html += '<div class="cb-plans">';
      html += '<div class="cb-header">';
      html += '<div class="cb-icon">' + ICONS.refresh + '</div>';
      html += '<h2>Consider Other Plans</h2>';
      html += '<p class="cb-subtitle">Switch to a plan that better fits your needs</p>';
      html += '</div>';
      html += '<div class="cb-plans-grid">';

      plans.forEach(function(plan) {
        html += '<div class="cb-plan" onclick="ChurnBuddy.selectPlan(\\'' + plan.id + '\\')">';
        html += '<div class="cb-plan-name">' + plan.name + '</div>';
        html += '<div class="cb-plan-price">';
        html += '<span class="cb-plan-price-old">$' + plan.originalPrice + '</span>';
        html += '<span class="cb-plan-price-new">$' + plan.discountedPrice.toFixed(2) + '</span>';
        html += '<span class="cb-plan-period">' + plan.period + '</span>';
        html += '</div>';
        html += '<div class="cb-plan-features">';
        (plan.highlights || []).forEach(function(h) {
          html += '<div class="cb-plan-feature">' + ICONS.check + '<span>' + h + '</span></div>';
        });
        html += '</div>';
        html += '</div>';
      });

      html += '</div>';
      html += '<div class="cb-footer">';
      html += '<button class="cb-btn cb-btn-secondary" onclick="ChurnBuddy.goBack()">Back</button>';
      html += '<button class="cb-btn cb-btn-slate" onclick="ChurnBuddy.nextStep()">No Thanks</button>';
      html += '</div>';
      html += '</div>';

    } else if (state.step === 'offer' && cfg.showOffer) {
      html += '<div class="cb-offer">';
      html += '<div class="cb-header">';
      html += '<div class="cb-icon">' + ICONS.tag + '</div>';
      html += '<h2>' + (cfg.offerTitle || 'Special Offer Just For You') + '</h2>';
      html += '</div>';
      html += '<div class="cb-offer-card">';
      html += '<span class="cb-offer-badge">Limited Time Offer</span>';
      html += '<div class="cb-offer-discount">' + (cfg.discountPercent || 20) + '% OFF</div>';
      html += '<div class="cb-offer-duration">for ' + (cfg.discountDuration || 3) + ' months</div>';
      html += '</div>';
      html += '<div class="cb-footer">';
      html += '<button class="cb-btn cb-btn-danger" onclick="ChurnBuddy.confirmCancel()">Cancel Anyway</button>';
      html += '<button class="cb-btn cb-btn-success" onclick="ChurnBuddy.acceptOffer()">Claim Discount</button>';
      html += '</div>';
      html += '</div>';
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
      state.onCancel = options.onCancel || function() {};
      state.onSaved = options.onSaved || function() {};
      state.onPlanSwitch = options.onPlanSwitch || function() {};

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
      }
      state.isOpen = true;
      state.selectedReason = '';
      state.selectedPlan = null;
      logEvent('cancellation_attempt', {});
      loadConfig();
    },

    close: function() {
      state.isOpen = false;
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
      if (state.step === 'plans' && cfg.showFeedback) {
        state.step = 'feedback';
      } else if (state.step === 'offer') {
        if (cfg.showPlans) {
          state.step = 'plans';
        } else if (cfg.showFeedback) {
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
      logEvent('offer_accepted', {
        reason: state.selectedReason,
        discountPercent: cfg.discountPercent,
        discountDuration: cfg.discountDuration
      });
      state.isOpen = false;
      render();
      if (state.onSaved) state.onSaved();
    },

    confirmCancel: function() {
      logEvent('subscription_canceled', {
        reason: state.selectedReason,
        offersDeclined: true
      });
      state.isOpen = false;
      render();
      if (state.onCancel) state.onCancel(state.selectedReason);
    }
  };

  document.addEventListener('DOMContentLoaded', function() {
    var script = document.querySelector('script[data-churnbuddy]');
    if (script) {
      ChurnBuddy.init({
        customerId: script.getAttribute('data-customer-id') || '',
        subscriptionId: script.getAttribute('data-subscription-id') || '',
        cancelButtonSelector: script.getAttribute('data-cancel-selector') || '[data-cancel-subscription]'
      });
    }
  });
})();
`;

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
