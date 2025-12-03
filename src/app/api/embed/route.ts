// =============================================================================
// Embeddable Cancel Flow Widget
// =============================================================================
// Serves a standalone JavaScript widget that can be embedded on any website.
// Usage: <script src="https://your-domain.com/api/embed?key=YOUR_API_KEY"></script>

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('key') || '';

  // Determine base URL - use env var, or detect from headers (Vercel/production), or fallback to request origin
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    // On Vercel, use x-forwarded-host or host header to get actual domain
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

  // Configuration
  var CONFIG = {
    apiKey: '${apiKey}',
    apiEndpoint: '${baseUrl}/api/cancel-flow',
    baseUrl: '${baseUrl}'
  };

  // Styles for the modal
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
    }
    .cb-modal {
      background: white;
      border-radius: 16px;
      max-width: 480px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .cb-header {
      padding: 24px 24px 0;
      text-align: center;
    }
    .cb-header h2 {
      margin: 0 0 8px;
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
    }
    .cb-header p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
    .cb-content {
      padding: 24px;
    }
    .cb-option {
      display: flex;
      align-items: center;
      padding: 16px;
      margin-bottom: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .cb-option:hover {
      border-color: #3b82f6;
      background: #f0f7ff;
    }
    .cb-option.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }
    .cb-option-letter {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: #6b7280;
      margin-right: 12px;
      flex-shrink: 0;
    }
    .cb-option.selected .cb-option-letter {
      background: #3b82f6;
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
      border-radius: 10px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .cb-btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }
    .cb-btn-secondary:hover {
      background: #e5e7eb;
    }
    .cb-btn-primary {
      background: #3b82f6;
      color: white;
    }
    .cb-btn-primary:hover {
      background: #2563eb;
    }
    .cb-btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    .cb-btn-danger {
      background: #ef4444;
      color: white;
    }
    .cb-btn-danger:hover {
      background: #dc2626;
    }
    .cb-btn-success {
      background: #10b981;
      color: white;
    }
    .cb-btn-success:hover {
      background: #059669;
    }
    .cb-offer-badge {
      display: inline-block;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .cb-offer-discount {
      font-size: 48px;
      font-weight: 700;
      color: #10b981;
      margin: 16px 0;
    }
    .cb-offer-duration {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 24px;
    }
    .cb-close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 32px;
      height: 32px;
      border: none;
      background: #f3f4f6;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      font-size: 20px;
    }
    .cb-close:hover {
      background: #e5e7eb;
    }
    .cb-modal-inner {
      position: relative;
    }
  \`;

  // Feedback options
  var FEEDBACK_OPTIONS = [
    { id: 'too_expensive', label: 'Too expensive for what I get', letter: 'A' },
    { id: 'not_using', label: "I'm not using it enough", letter: 'B' },
    { id: 'missing_features', label: 'Missing features I need', letter: 'C' },
    { id: 'found_alternative', label: 'Found a better alternative', letter: 'D' },
    { id: 'other', label: 'Other reason', letter: 'E' }
  ];

  // State
  var state = {
    isOpen: false,
    step: 'feedback', // feedback, offer
    selectedReason: '',
    customerId: '',
    subscriptionId: '',
    discountPercent: 50,
    discountDuration: '3 months',
    onCancel: null,
    onSaved: null
  };

  // Inject styles
  function injectStyles() {
    if (document.getElementById('cb-styles')) return;
    var style = document.createElement('style');
    style.id = 'cb-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  // Log event to API
  function logEvent(eventType, details) {
    fetch(CONFIG.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: eventType,
        customerId: state.customerId,
        subscriptionId: state.subscriptionId,
        details: details
      })
    }).catch(function(err) {
      console.error('ChurnBuddy: Failed to log event', err);
    });
  }

  // Render modal
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

    var html = '<div class="cb-overlay">';
    html += '<div class="cb-modal"><div class="cb-modal-inner">';
    html += '<button class="cb-close" onclick="ChurnBuddy.close()">&times;</button>';

    if (state.step === 'feedback') {
      html += '<div class="cb-header">';
      html += '<h2>Before you go...</h2>';
      html += '<p>We\\'d love to know why you\\'re leaving</p>';
      html += '</div>';
      html += '<div class="cb-content">';

      FEEDBACK_OPTIONS.forEach(function(opt) {
        var selected = state.selectedReason === opt.id ? ' selected' : '';
        html += '<div class="cb-option' + selected + '" onclick="ChurnBuddy.selectReason(\\'' + opt.id + '\\')">';
        html += '<div class="cb-option-letter">' + opt.letter + '</div>';
        html += '<div class="cb-option-text">' + opt.label + '</div>';
        html += '</div>';
      });

      html += '</div>';
      html += '<div class="cb-footer">';
      html += '<button class="cb-btn cb-btn-secondary" onclick="ChurnBuddy.close()">Keep Subscription</button>';
      html += '<button class="cb-btn cb-btn-primary" onclick="ChurnBuddy.nextStep()"' + (state.selectedReason ? '' : ' disabled') + '>Continue</button>';
      html += '</div>';
    } else if (state.step === 'offer') {
      html += '<div class="cb-header">';
      html += '<span class="cb-offer-badge">SPECIAL OFFER</span>';
      html += '<h2>Wait! Here\\'s a deal for you</h2>';
      html += '</div>';
      html += '<div class="cb-content" style="text-align: center;">';
      html += '<div class="cb-offer-discount">' + state.discountPercent + '% OFF</div>';
      html += '<div class="cb-offer-duration">for ' + state.discountDuration + '</div>';
      html += '<p style="color: #6b7280;">Stay with us and enjoy this exclusive discount on your subscription.</p>';
      html += '</div>';
      html += '<div class="cb-footer">';
      html += '<button class="cb-btn cb-btn-danger" onclick="ChurnBuddy.confirmCancel()">Cancel Anyway</button>';
      html += '<button class="cb-btn cb-btn-success" onclick="ChurnBuddy.acceptOffer()">Claim Discount</button>';
      html += '</div>';
    }

    html += '</div></div></div>';
    container.innerHTML = html;
  }

  // Public API
  window.ChurnBuddy = {
    init: function(options) {
      injectStyles();
      state.customerId = options.customerId || '';
      state.subscriptionId = options.subscriptionId || '';
      state.discountPercent = options.discountPercent || 50;
      state.discountDuration = options.discountDuration || '3 months';
      state.onCancel = options.onCancel || function() {};
      state.onSaved = options.onSaved || function() {};

      // Auto-attach to cancel buttons
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
      state.step = 'feedback';
      state.selectedReason = '';
      logEvent('cancellation_attempt', {});
      render();
    },

    close: function() {
      state.isOpen = false;
      render();
    },

    selectReason: function(reasonId) {
      state.selectedReason = reasonId;
      render();
    },

    nextStep: function() {
      if (state.step === 'feedback' && state.selectedReason) {
        logEvent('feedback_submitted', { reason: state.selectedReason });
        state.step = 'offer';
        render();
      }
    },

    acceptOffer: function() {
      logEvent('offer_accepted', {
        reason: state.selectedReason,
        discountPercent: state.discountPercent,
        discountDuration: state.discountDuration
      });
      state.isOpen = false;
      render();
      if (state.onSaved) state.onSaved();
    },

    confirmCancel: function() {
      logEvent('cancellation_confirmed', {
        reason: state.selectedReason,
        offersDeclined: true
      });
      state.isOpen = false;
      render();
      if (state.onCancel) state.onCancel(state.selectedReason);
    }
  };

  // Auto-initialize if data attributes present
  document.addEventListener('DOMContentLoaded', function() {
    var script = document.querySelector('script[data-churnbuddy]');
    if (script) {
      ChurnBuddy.init({
        customerId: script.getAttribute('data-customer-id') || '',
        subscriptionId: script.getAttribute('data-subscription-id') || '',
        discountPercent: parseInt(script.getAttribute('data-discount-percent')) || 50,
        discountDuration: script.getAttribute('data-discount-duration') || '3 months',
        cancelButtonSelector: script.getAttribute('data-cancel-selector') || '[data-cancel-subscription]'
      });
    }
  });
})();
`;

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
