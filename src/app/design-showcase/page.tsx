'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  X, Heart, Check, RotateCcw, Tag, Clock,
  ChevronRight, Sparkles, Shield,
  Gift, Zap, Star, Crown, Monitor, Smartphone
} from 'lucide-react';

// Sample data
const SAMPLE_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    originalPrice: 29,
    discountPercent: 80,
    discountDurationMonths: 3,
    period: '/mo',
    highlights: ['5 projects', 'Basic analytics', 'Email support', '1GB storage'],
  },
  {
    id: 'pro',
    name: 'Pro',
    originalPrice: 79,
    discountPercent: 80,
    discountDurationMonths: 3,
    period: '/mo',
    highlights: ['25 projects', 'Advanced analytics', 'Priority support', '10GB storage'],
  },
];

const SAMPLE_OPTIONS = [
  { id: 'too_expensive', label: 'Too expensive for what I get', letter: 'A' },
  { id: 'not_using', label: "I'm not using it enough", letter: 'B' },
  { id: 'missing_features', label: 'Missing features I need', letter: 'C' },
  { id: 'found_alternative', label: 'Found a better alternative', letter: 'D' },
];

const getDiscountedPrice = (price: number, discount: number) =>
  (price * (1 - discount / 100)).toFixed(2);

// ============================================================================
// STYLE 1: Classic Card (Current Design)
// ============================================================================
function Style1Feedback() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-purple-50">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-purple-600 fill-purple-600" />
          <span className="font-semibold text-sm text-purple-600">Your Feedback</span>
        </div>
        <button className="p-1 rounded-md hover:bg-purple-100"><X className="h-4 w-4 text-purple-600" /></button>
      </div>
      <div className="px-6 py-4">
        <h2 className="font-bold text-[22px] text-gray-900 mt-2">Sorry to see you go.</h2>
        <p className="text-sm text-gray-600 mt-1 mb-6">Please be honest about why you're leaving.</p>
        <div className="space-y-3">
          {SAMPLE_OPTIONS.map((opt) => (
            <button key={opt.id} onClick={() => setSelected(opt.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left ${
                selected === opt.id ? 'bg-purple-100 border-purple-600 border-2' : 'bg-purple-50 border-purple-200'
              }`}>
              <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                selected === opt.id ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border'
              }`}>{opt.letter}</span>
              <span className="flex-1 font-medium text-gray-800">{opt.label}</span>
              {selected === opt.id && <Check className="h-5 w-5 text-purple-600" />}
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-6">
          <button className="bg-purple-100 text-purple-900 px-4 py-2 rounded-lg font-medium">Back</button>
          <button className="bg-black text-white px-6 py-2 rounded-lg font-medium">Next</button>
        </div>
      </div>
    </div>
  );
}

function Style1Plans() {
  return (
    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-blue-50">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-sm text-blue-600">Consider Other Plans</span>
        </div>
        <button className="p-1 rounded-md hover:bg-blue-100"><X className="h-4 w-4 text-blue-600" /></button>
      </div>
      <div className="px-6 py-4">
        <h2 className="text-center font-bold text-[22px] text-gray-900 mt-4">How about 80% off?</h2>
        <p className="text-center text-sm text-gray-600 mt-2 mb-6">Keep all your history and settings.</p>
        <div className="grid grid-cols-2 gap-4">
          {SAMPLE_PLANS.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl shadow-lg p-4 border">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-gray-400 line-through text-sm">${plan.originalPrice}</span>
                <span className="text-blue-600 font-bold text-2xl">${getDiscountedPrice(plan.originalPrice, plan.discountPercent)}</span>
                <span className="text-gray-500 text-sm">{plan.period}</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">{plan.discountPercent}% off for {plan.discountDurationMonths} months</p>
              <ul className="space-y-1 mb-4">{plan.highlights.map((h, i) => <li key={i} className="text-sm text-gray-700">{h}</li>)}</ul>
              <button className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg">Switch Plan</button>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-6">
          <button className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-medium">Back</button>
          <button className="bg-black text-white px-4 py-2 rounded-lg font-medium">Decline Offer</button>
        </div>
      </div>
    </div>
  );
}

function Style1Offer() {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-red-50">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-red-600" />
          <span className="font-semibold text-sm text-red-600">Special Offer</span>
        </div>
        <button className="p-1 rounded-md hover:bg-red-100"><X className="h-4 w-4 text-red-600" /></button>
      </div>
      <div className="px-6 py-4">
        <h2 className="font-bold text-[22px] text-gray-900 mt-2">Stay to get 50% off for 3 months.</h2>
        <p className="text-sm text-gray-600 mt-1 mb-6">You're eligible for our special discount.</p>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-red-700" />
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Time-Limited Deal</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-4">50% off for 3 months</p>
          <button className="w-full bg-red-500 text-white font-semibold py-3 px-4 rounded-lg">Accept This Offer</button>
        </div>
        <div className="flex justify-between mt-6">
          <button className="bg-gray-100 text-black px-4 py-2 rounded-lg font-medium">Back</button>
          <button className="bg-black text-white px-4 py-2 rounded-lg font-medium">Decline Offer</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STYLE 2: Minimal Flat
// ============================================================================
function Style2Feedback() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="w-full max-w-md bg-white border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Feedback</span>
          <button className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="px-6 py-6">
        <h2 className="text-2xl font-light text-gray-900 mb-1">Why are you leaving?</h2>
        <p className="text-sm text-gray-400 mb-8">Your feedback helps us improve.</p>
        <div className="space-y-2">
          {SAMPLE_OPTIONS.map((opt) => (
            <button key={opt.id} onClick={() => setSelected(opt.id)}
              className={`w-full flex items-center justify-between p-4 border transition-all text-left ${
                selected === opt.id ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
              <span className="text-gray-700">{opt.label}</span>
              {selected === opt.id && <Check className="h-4 w-4 text-gray-900" />}
            </button>
          ))}
        </div>
      </div>
      <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
        <button className="text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
        <button className="bg-gray-900 text-white px-6 py-2 font-medium hover:bg-gray-800">Continue</button>
      </div>
    </div>
  );
}

function Style2Plans() {
  return (
    <div className="w-full max-w-lg bg-white border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Plans</span>
          <button className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="px-6 py-6">
        <h2 className="text-2xl font-light text-gray-900 mb-1">Consider a different plan</h2>
        <p className="text-sm text-gray-400 mb-8">Exclusive pricing just for you.</p>
        <div className="grid grid-cols-2 gap-4">
          {SAMPLE_PLANS.map((plan) => (
            <div key={plan.id} className="border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-3">{plan.name}</h3>
              <div className="mb-3">
                <span className="text-3xl font-light text-gray-900">${getDiscountedPrice(plan.originalPrice, plan.discountPercent)}</span>
                <span className="text-gray-400 text-sm">{plan.period}</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">was ${plan.originalPrice}/mo</p>
              <ul className="space-y-2 mb-5 text-sm text-gray-600">
                {plan.highlights.map((h, i) => <li key={i}>— {h}</li>)}
              </ul>
              <button className="w-full border border-gray-900 text-gray-900 py-2 font-medium hover:bg-gray-900 hover:text-white transition-colors">Select</button>
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
        <button className="text-gray-500 hover:text-gray-700 font-medium">Back</button>
        <button className="text-gray-500 hover:text-gray-700 font-medium">No thanks</button>
      </div>
    </div>
  );
}

function Style2Offer() {
  return (
    <div className="w-full max-w-md bg-white border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Offer</span>
          <button className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="px-6 py-6">
        <h2 className="text-2xl font-light text-gray-900 mb-1">One last offer</h2>
        <p className="text-sm text-gray-400 mb-8">We'd really hate to see you go.</p>
        <div className="border-2 border-gray-900 p-6 text-center">
          <p className="text-4xl font-light text-gray-900 mb-2">50% OFF</p>
          <p className="text-sm text-gray-500 mb-6">for the next 3 months</p>
          <button className="w-full bg-gray-900 text-white py-3 font-medium">Accept Offer</button>
        </div>
      </div>
      <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
        <button className="text-gray-500 hover:text-gray-700 font-medium">Back</button>
        <button className="text-gray-500 hover:text-gray-700 font-medium">Cancel subscription</button>
      </div>
    </div>
  );
}

// ============================================================================
// STYLE 3: Glassmorphism
// ============================================================================
function Style3Feedback() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-800">Tell us why</span>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center hover:bg-white/80">
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>
      <div className="px-6 py-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
          We're sad to see you go
        </h2>
        <p className="text-gray-500 mt-2 mb-6">Help us understand what went wrong.</p>
        <div className="space-y-3">
          {SAMPLE_OPTIONS.map((opt) => (
            <button key={opt.id} onClick={() => setSelected(opt.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                selected === opt.id
                  ? 'border-violet-500 bg-violet-50/50 shadow-lg shadow-violet-500/20'
                  : 'border-transparent bg-white/50 hover:bg-white/80'
              }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                selected === opt.id ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>{opt.letter}</div>
              <span className="flex-1 text-gray-700">{opt.label}</span>
              {selected === opt.id && <Check className="h-5 w-5 text-violet-600" />}
            </button>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button className="flex-1 py-3 rounded-xl font-medium text-gray-600 bg-white/50 hover:bg-white/80">Cancel</button>
          <button className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
            Continue <ChevronRight className="inline h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Style3Plans() {
  return (
    <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-800">Special Plans</span>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center hover:bg-white/80">
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>
      <div className="px-6 py-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent text-center">
          Exclusive 80% Off
        </h2>
        <p className="text-gray-500 mt-2 mb-6 text-center">These deals aren't available anywhere else.</p>
        <div className="grid grid-cols-2 gap-4">
          {SAMPLE_PLANS.map((plan, idx) => (
            <div key={plan.id} className={`p-5 rounded-2xl border-2 ${
              idx === 1 ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg shadow-blue-500/20' : 'border-transparent bg-white/50'
            }`}>
              {idx === 1 && <span className="text-xs font-bold text-blue-600 uppercase">Popular</span>}
              <h3 className="font-bold text-lg text-gray-900 mt-1">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  ${getDiscountedPrice(plan.originalPrice, plan.discountPercent)}
                </span>
                <span className="text-gray-400 text-sm">{plan.period}</span>
              </div>
              <p className="text-xs text-gray-400 line-through mb-3">${plan.originalPrice}/mo</p>
              <ul className="space-y-1 mb-4">
                {plan.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                    <Check className="h-3 w-3 text-blue-500" />{h}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-2 rounded-xl font-semibold ${
                idx === 1
                  ? 'text-white bg-gradient-to-r from-blue-500 to-cyan-500'
                  : 'text-gray-700 bg-white border border-gray-200'
              }`}>Choose</button>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button className="flex-1 py-3 rounded-xl font-medium text-gray-600 bg-white/50">Back</button>
          <button className="flex-1 py-3 rounded-xl font-medium text-gray-600 bg-white/50">Skip</button>
        </div>
      </div>
    </div>
  );
}

function Style3Offer() {
  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-rose-500/10 to-orange-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
              <Gift className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-800">Final Offer</span>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center hover:bg-white/80">
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>
      <div className="px-6 py-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
          Wait! Here's 50% off
        </h2>
        <p className="text-gray-500 mt-2 mb-6">We'd hate to lose you as a customer.</p>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 border-2 border-rose-200 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-600 text-xs font-bold mb-4">
            <Clock className="h-3 w-3" /> Limited Time
          </div>
          <p className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent mb-1">50% OFF</p>
          <p className="text-gray-500 mb-6">for the next 3 months</p>
          <button className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-500 to-orange-500 shadow-lg shadow-rose-500/30">
            Claim This Deal
          </button>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="flex-1 py-3 rounded-xl font-medium text-gray-600 bg-white/50">Back</button>
          <button className="flex-1 py-3 rounded-xl font-medium text-gray-600 bg-white/50">No thanks</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STYLE 4: Brutalist
// ============================================================================
function Style4Feedback() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="px-4 py-3 bg-yellow-300 border-b-4 border-black flex items-center justify-between">
        <span className="font-black uppercase tracking-wider">FEEDBACK</span>
        <button className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center hover:bg-red-500 hover:text-white">
          <X className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>
      <div className="p-6">
        <h2 className="text-3xl font-black uppercase mb-2">WHY ARE YOU LEAVING?</h2>
        <p className="text-gray-600 mb-6">Tell us the truth. We can handle it.</p>
        <div className="space-y-3">
          {SAMPLE_OPTIONS.map((opt) => (
            <button key={opt.id} onClick={() => setSelected(opt.id)}
              className={`w-full flex items-center gap-3 p-4 border-3 border-black transition-all text-left ${
                selected === opt.id
                  ? 'bg-lime-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-1 -translate-y-1'
                  : 'bg-white hover:bg-gray-100'
              }`}
              style={{ borderWidth: '3px' }}>
              <span className={`w-8 h-8 flex items-center justify-center font-black border-2 border-black ${
                selected === opt.id ? 'bg-black text-lime-300' : 'bg-white'
              }`}>{opt.letter}</span>
              <span className="flex-1 font-bold">{opt.label}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-4 mt-6">
          <button className="px-6 py-3 bg-white border-3 border-black font-black uppercase hover:bg-gray-100" style={{ borderWidth: '3px' }}>
            BACK
          </button>
          <button className="flex-1 px-6 py-3 bg-black text-white font-black uppercase border-3 border-black hover:bg-gray-800" style={{ borderWidth: '3px' }}>
            NEXT →
          </button>
        </div>
      </div>
    </div>
  );
}

function Style4Plans() {
  return (
    <div className="w-full max-w-lg bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="px-4 py-3 bg-cyan-400 border-b-4 border-black flex items-center justify-between">
        <span className="font-black uppercase tracking-wider">PLANS</span>
        <button className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center hover:bg-red-500 hover:text-white">
          <X className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>
      <div className="p-6">
        <h2 className="text-3xl font-black uppercase mb-2 text-center">80% OFF DEALS</h2>
        <p className="text-gray-600 mb-6 text-center">Secret prices. Don't tell anyone.</p>
        <div className="grid grid-cols-2 gap-4">
          {SAMPLE_PLANS.map((plan) => (
            <div key={plan.id} className="border-3 border-black p-4 bg-white" style={{ borderWidth: '3px' }}>
              <h3 className="font-black text-xl uppercase">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-4xl font-black">${getDiscountedPrice(plan.originalPrice, plan.discountPercent)}</span>
                <span className="text-sm">{plan.period}</span>
              </div>
              <p className="text-sm text-gray-500 line-through">${plan.originalPrice}/mo</p>
              <ul className="mt-3 space-y-1 text-sm mb-4">
                {plan.highlights.map((h, i) => <li key={i}>✓ {h}</li>)}
              </ul>
              <button className="w-full py-2 bg-black text-white font-black uppercase border-2 border-black hover:bg-yellow-300 hover:text-black">
                GET IT
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-6">
          <button className="px-6 py-3 bg-white border-3 border-black font-black uppercase" style={{ borderWidth: '3px' }}>BACK</button>
          <button className="flex-1 px-6 py-3 bg-white border-3 border-black font-black uppercase" style={{ borderWidth: '3px' }}>SKIP</button>
        </div>
      </div>
    </div>
  );
}

function Style4Offer() {
  return (
    <div className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="px-4 py-3 bg-red-500 text-white border-b-4 border-black flex items-center justify-between">
        <span className="font-black uppercase tracking-wider">LAST CHANCE</span>
        <button className="w-8 h-8 bg-white text-black border-2 border-black flex items-center justify-center hover:bg-yellow-300">
          <X className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>
      <div className="p-6">
        <h2 className="text-3xl font-black uppercase mb-2">FINAL OFFER!</h2>
        <p className="text-gray-600 mb-6">This is it. Take it or leave it.</p>
        <div className="border-4 border-black bg-yellow-300 p-6 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-6xl font-black">50%</p>
          <p className="text-2xl font-black uppercase">OFF</p>
          <p className="text-sm mt-2 mb-4">FOR 3 MONTHS</p>
          <button className="w-full py-3 bg-black text-white font-black uppercase text-lg border-3 border-black" style={{ borderWidth: '3px' }}>
            TAKE THE DEAL
          </button>
        </div>
        <div className="flex gap-4 mt-6">
          <button className="px-6 py-3 bg-white border-3 border-black font-black uppercase" style={{ borderWidth: '3px' }}>BACK</button>
          <button className="flex-1 px-6 py-3 bg-white border-3 border-black font-black uppercase" style={{ borderWidth: '3px' }}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STYLE 5: Dark Mode Premium
// ============================================================================
function Style5Feedback() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">Your Feedback</p>
            </div>
          </div>
          <button className="text-gray-500 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="p-5">
        <h2 className="text-xl font-semibold text-white mb-1">We're sorry to see you go</h2>
        <p className="text-gray-400 text-sm mb-6">Help us understand why you're leaving.</p>
        <div className="space-y-2">
          {SAMPLE_OPTIONS.map((opt) => (
            <button key={opt.id} onClick={() => setSelected(opt.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left ${
                selected === opt.id
                  ? 'bg-purple-500/20 border border-purple-500'
                  : 'bg-gray-800/50 border border-gray-800 hover:border-gray-700'
              }`}>
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-medium ${
                selected === opt.id ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>{opt.letter}</span>
              <span className="flex-1 text-gray-200">{opt.label}</span>
              {selected === opt.id && <Check className="h-4 w-4 text-purple-400" />}
            </button>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button className="px-5 py-2.5 rounded-xl font-medium text-gray-400 bg-gray-800 hover:bg-gray-700">Cancel</button>
          <button className="flex-1 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function Style5Plans() {
  return (
    <div className="w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">Exclusive Offers</p>
            </div>
          </div>
          <button className="text-gray-500 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="p-5">
        <h2 className="text-xl font-semibold text-white text-center mb-1">Special pricing for you</h2>
        <p className="text-gray-400 text-sm text-center mb-6">80% off select plans.</p>
        <div className="grid grid-cols-2 gap-4">
          {SAMPLE_PLANS.map((plan, idx) => (
            <div key={plan.id} className={`p-4 rounded-xl border ${
              idx === 1 ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 bg-gray-800/50'
            }`}>
              {idx === 1 && <span className="text-xs font-medium text-blue-400">RECOMMENDED</span>}
              <h3 className="font-semibold text-white mt-1">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-2xl font-bold text-white">${getDiscountedPrice(plan.originalPrice, plan.discountPercent)}</span>
                <span className="text-gray-500 text-sm">{plan.period}</span>
              </div>
              <p className="text-xs text-gray-500 line-through">${plan.originalPrice}/mo</p>
              <ul className="mt-3 space-y-1 mb-4">
                {plan.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-gray-400 flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />{h}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-2 rounded-lg font-medium ${
                idx === 1
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}>Select</button>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button className="px-5 py-2.5 rounded-xl font-medium text-gray-400 bg-gray-800">Back</button>
          <button className="flex-1 py-2.5 rounded-xl font-medium text-gray-400 bg-gray-800">No thanks</button>
        </div>
      </div>
    </div>
  );
}

function Style5Offer() {
  return (
    <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">Final Offer</p>
            </div>
          </div>
          <button className="text-gray-500 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="p-5">
        <h2 className="text-xl font-semibold text-white mb-1">Wait! Don't leave yet</h2>
        <p className="text-gray-400 text-sm mb-6">Here's an exclusive offer just for you.</p>
        <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium mb-4">
            <Clock className="h-3 w-3" /> Expires in 10 minutes
          </div>
          <p className="text-5xl font-bold text-white mb-1">50% OFF</p>
          <p className="text-gray-400 mb-6">for 3 months</p>
          <button className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500">
            Claim Offer
          </button>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="px-5 py-2.5 rounded-xl font-medium text-gray-400 bg-gray-800">Back</button>
          <button className="flex-1 py-2.5 rounded-xl font-medium text-gray-400 bg-gray-800">Cancel anyway</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STYLE 6: Soft Rounded
// ============================================================================
function Style6Feedback() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="w-full max-w-md bg-gradient-to-b from-rose-50 to-white rounded-[32px] shadow-xl shadow-rose-100/50 overflow-hidden p-1">
      <div className="bg-white rounded-[28px] overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
              <Heart className="h-6 w-6 text-rose-500" />
            </div>
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200">
              <X className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Before you go...</h2>
          <p className="text-gray-500 mb-6">We'd love to know why you're leaving.</p>
          <div className="space-y-3">
            {SAMPLE_OPTIONS.map((opt) => (
              <button key={opt.id} onClick={() => setSelected(opt.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
                  selected === opt.id
                    ? 'bg-rose-100 shadow-inner'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold ${
                  selected === opt.id ? 'bg-rose-500 text-white' : 'bg-white text-gray-500 shadow-sm'
                }`}>{opt.letter}</div>
                <span className="flex-1 text-gray-700 font-medium">{opt.label}</span>
                {selected === opt.id && (
                  <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-8">
            <button className="px-6 py-3 rounded-2xl font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200">
              Cancel
            </button>
            <button className="flex-1 py-3 rounded-2xl font-semibold text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30">
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Style6Plans() {
  return (
    <div className="w-full max-w-lg bg-gradient-to-b from-blue-50 to-white rounded-[32px] shadow-xl shadow-blue-100/50 overflow-hidden p-1">
      <div className="bg-white rounded-[28px] overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Star className="h-6 w-6 text-blue-500" />
            </div>
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200">
              <X className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">How about a better plan?</h2>
          <p className="text-gray-500 text-center mb-6">80% off — just for you.</p>
          <div className="grid grid-cols-2 gap-4">
            {SAMPLE_PLANS.map((plan) => (
              <div key={plan.id} className="p-5 rounded-3xl bg-gray-50">
                <h3 className="font-bold text-gray-800">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-blue-600">${getDiscountedPrice(plan.originalPrice, plan.discountPercent)}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <p className="text-xs text-gray-400 line-through mb-4">${plan.originalPrice}/mo</p>
                <ul className="space-y-2 mb-4">
                  {plan.highlights.map((h, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-blue-600" />
                      </div>
                      {h}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-2.5 rounded-xl font-semibold text-blue-600 bg-blue-100 hover:bg-blue-200">
                  Choose
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-8">
            <button className="px-6 py-3 rounded-2xl font-semibold text-gray-500 bg-gray-100">Back</button>
            <button className="flex-1 py-3 rounded-2xl font-semibold text-gray-500 bg-gray-100">Skip</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Style6Offer() {
  return (
    <div className="w-full max-w-md bg-gradient-to-b from-amber-50 to-white rounded-[32px] shadow-xl shadow-amber-100/50 overflow-hidden p-1">
      <div className="bg-white rounded-[28px] overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Gift className="h-6 w-6 text-amber-500" />
            </div>
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200">
              <X className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">One last thing...</h2>
          <p className="text-gray-500 mb-6">A special thank you for being with us.</p>
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-600 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" /> Limited offer
            </div>
            <p className="text-4xl font-bold text-gray-800 mb-1">50% OFF</p>
            <p className="text-gray-500 mb-6">for 3 months</p>
            <button className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
              Accept Offer
            </button>
          </div>
          <div className="flex gap-3 mt-8">
            <button className="px-6 py-3 rounded-2xl font-semibold text-gray-500 bg-gray-100">Back</button>
            <button className="flex-1 py-3 rounded-2xl font-semibold text-gray-500 bg-gray-100">No thanks</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STYLE 7: Corporate Sharp
// ============================================================================
function Style7Feedback() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="w-full max-w-md bg-white shadow-xl">
      <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
        <h3 className="font-semibold">Cancel Subscription</h3>
        <button className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
      </div>
      <div className="px-6 py-6">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Feedback</p>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Reason for cancellation</h2>
        <p className="text-slate-500 text-sm mb-6">Please select the primary reason.</p>
        <div className="space-y-2">
          {SAMPLE_OPTIONS.map((opt) => (
            <label key={opt.id}
              className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
                selected === opt.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
              }`}>
              <input type="radio" name="reason" checked={selected === opt.id} onChange={() => setSelected(opt.id)}
                className="w-4 h-4 text-slate-900 border-slate-300" />
              <span className="text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
          <button className="px-4 py-2 text-slate-600 hover:text-slate-900">Cancel</button>
          <button className="px-6 py-2 bg-slate-900 text-white hover:bg-slate-800">Continue</button>
        </div>
      </div>
    </div>
  );
}

function Style7Plans() {
  return (
    <div className="w-full max-w-lg bg-white shadow-xl">
      <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
        <h3 className="font-semibold">Cancel Subscription</h3>
        <button className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
      </div>
      <div className="px-6 py-6">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Plans</p>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Alternative plans available</h2>
        <p className="text-slate-500 text-sm mb-6">Save up to 80% with these exclusive offers.</p>
        <div className="grid grid-cols-2 gap-4">
          {SAMPLE_PLANS.map((plan) => (
            <div key={plan.id} className="border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900">${getDiscountedPrice(plan.originalPrice, plan.discountPercent)}</span>
                <span className="text-slate-500 text-sm">{plan.period}</span>
              </div>
              <p className="text-xs text-slate-400 line-through">${plan.originalPrice}/mo</p>
              <p className="text-xs text-green-600 font-medium mt-1 mb-3">Save {plan.discountPercent}%</p>
              <ul className="space-y-1 mb-4 text-sm text-slate-600">
                {plan.highlights.map((h, i) => <li key={i}>• {h}</li>)}
              </ul>
              <button className="w-full py-2 border border-slate-900 text-slate-900 font-medium hover:bg-slate-900 hover:text-white transition-colors">
                Select Plan
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
          <button className="px-4 py-2 text-slate-600 hover:text-slate-900">Back</button>
          <button className="px-4 py-2 text-slate-600 hover:text-slate-900">Decline</button>
        </div>
      </div>
    </div>
  );
}

function Style7Offer() {
  return (
    <div className="w-full max-w-md bg-white shadow-xl">
      <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
        <h3 className="font-semibold">Cancel Subscription</h3>
        <button className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
      </div>
      <div className="px-6 py-6">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Offer</p>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Final retention offer</h2>
        <p className="text-slate-500 text-sm mb-6">We'd like to offer you a special discount.</p>
        <div className="border-2 border-green-500 bg-green-50 p-6">
          <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-3">
            <Shield className="h-4 w-4" /> Exclusive Offer
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">50% discount</p>
          <p className="text-slate-600 mb-6">Applied for the next 3 billing cycles</p>
          <button className="w-full py-3 bg-green-600 text-white font-semibold hover:bg-green-700">
            Apply Discount
          </button>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
          <button className="px-4 py-2 text-slate-600 hover:text-slate-900">Back</button>
          <button className="px-4 py-2 text-red-600 hover:text-red-700">Confirm Cancellation</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STYLE 8: Playful
// ============================================================================
function Style8Feedback() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-indigo-100">
      <div className="px-6 py-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">😢</span>
            <span className="font-bold text-white text-lg">Oh no!</span>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="px-6 py-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Why are you leaving us? 💔</h2>
        <p className="text-gray-500 mb-6">Pick the reason that fits best</p>
        <div className="space-y-3">
          {SAMPLE_OPTIONS.map((opt, idx) => {
            const emojis = ['💰', '😴', '🤔', '👀'];
            return (
              <button key={opt.id} onClick={() => setSelected(opt.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                  selected === opt.id
                    ? 'border-indigo-500 bg-indigo-50 scale-[1.02] shadow-lg'
                    : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                }`}>
                <span className="text-2xl">{emojis[idx]}</span>
                <span className="flex-1 font-medium text-gray-700">{opt.label}</span>
                {selected === opt.id && <span className="text-xl">✅</span>}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 mt-6">
          <button className="px-5 py-3 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">
            ← Back
          </button>
          <button className="flex-1 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 shadow-lg shadow-indigo-500/30">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

function Style8Plans() {
  return (
    <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-cyan-100">
      <div className="px-6 py-5 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎁</span>
            <span className="font-bold text-white text-lg">Secret deals!</span>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="px-6 py-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Psst... 80% off! 🤫</h2>
        <p className="text-gray-500 text-center mb-6">These prices are just between us</p>
        <div className="grid grid-cols-2 gap-4">
          {SAMPLE_PLANS.map((plan, idx) => (
            <div key={plan.id} className={`p-5 rounded-2xl border-2 ${
              idx === 1 ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-gray-50'
            }`}>
              {idx === 1 && <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">⭐ BEST DEAL</span>}
              <h3 className="font-bold text-gray-800 mt-2">{plan.name}</h3>
              <div className="mt-1">
                <span className="text-3xl font-black text-gray-800">${getDiscountedPrice(plan.originalPrice, plan.discountPercent)}</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>
              <p className="text-sm text-gray-400 line-through">${plan.originalPrice}/mo</p>
              <ul className="mt-3 space-y-1 mb-4">
                {plan.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-gray-600">✓ {h}</li>
                ))}
              </ul>
              <button className={`w-full py-2.5 rounded-xl font-bold ${
                idx === 1
                  ? 'text-white bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'text-gray-700 bg-white border-2 border-gray-300'
              }`}>Pick me!</button>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button className="px-5 py-3 rounded-2xl font-bold text-gray-500 bg-gray-100">← Back</button>
          <button className="flex-1 py-3 rounded-2xl font-bold text-gray-500 bg-gray-100">Maybe later</button>
        </div>
      </div>
    </div>
  );
}

function Style8Offer() {
  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-orange-100">
      <div className="px-6 py-5 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚨</span>
            <span className="font-bold text-white text-lg">Wait!</span>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="px-6 py-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Don't go yet! 🙏</h2>
        <p className="text-gray-500 mb-6">We have something special for you</p>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-100 to-pink-100 text-center border-2 border-orange-200">
          <span className="text-4xl mb-3 block">🎉</span>
          <p className="text-5xl font-black text-gray-800 mb-1">50% OFF</p>
          <p className="text-gray-600 font-medium mb-6">for 3 whole months!</p>
          <button className="w-full py-4 rounded-2xl font-bold text-white text-lg bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg shadow-orange-500/30 hover:scale-[1.02] transition-transform">
            Yes please! 🎁
          </button>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="px-5 py-3 rounded-2xl font-bold text-gray-500 bg-gray-100">← Back</button>
          <button className="flex-1 py-3 rounded-2xl font-bold text-gray-500 bg-gray-100">No thanks 😔</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STYLE 9: Elegant Serif
// ============================================================================
function Style9Feedback() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="w-full max-w-md bg-stone-50 rounded-lg shadow-xl overflow-hidden">
      <div className="px-8 py-6 border-b border-stone-200">
        <div className="flex items-center justify-between">
          <span className="text-sm tracking-[0.2em] text-stone-500 uppercase">Feedback</span>
          <button className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="px-8 py-8">
        <h2 className="text-3xl font-serif text-stone-800 mb-3">We're sorry to see you go</h2>
        <p className="text-stone-500 mb-8 font-light">Your feedback is invaluable to us.</p>
        <div className="space-y-4">
          {SAMPLE_OPTIONS.map((opt) => (
            <button key={opt.id} onClick={() => setSelected(opt.id)}
              className={`w-full flex items-center gap-4 p-5 rounded-lg border transition-all text-left ${
                selected === opt.id
                  ? 'border-stone-800 bg-white shadow-sm'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-serif ${
                selected === opt.id ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500'
              }`}>{opt.letter}</span>
              <span className="flex-1 text-stone-700 font-light">{opt.label}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-4 mt-10">
          <button className="px-6 py-3 text-stone-500 hover:text-stone-700 font-light tracking-wide">
            Cancel
          </button>
          <button className="flex-1 py-3 bg-stone-800 text-white hover:bg-stone-900 font-light tracking-wide">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function Style9Plans() {
  return (
    <div className="w-full max-w-lg bg-stone-50 rounded-lg shadow-xl overflow-hidden">
      <div className="px-8 py-6 border-b border-stone-200">
        <div className="flex items-center justify-between">
          <span className="text-sm tracking-[0.2em] text-stone-500 uppercase">Alternative Plans</span>
          <button className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="px-8 py-8">
        <h2 className="text-3xl font-serif text-stone-800 text-center mb-3">Perhaps a different plan?</h2>
        <p className="text-stone-500 text-center mb-8 font-light">Exclusive pricing, just for you.</p>
        <div className="grid grid-cols-2 gap-6">
          {SAMPLE_PLANS.map((plan) => (
            <div key={plan.id} className="bg-white p-6 rounded-lg border border-stone-200">
              <h3 className="font-serif text-xl text-stone-800">{plan.name}</h3>
              <div className="mt-3">
                <span className="text-3xl font-light text-stone-800">${getDiscountedPrice(plan.originalPrice, plan.discountPercent)}</span>
                <span className="text-stone-400 text-sm font-light">{plan.period}</span>
              </div>
              <p className="text-sm text-stone-400 line-through font-light">${plan.originalPrice}/mo</p>
              <div className="my-4 border-t border-stone-100 pt-4">
                <ul className="space-y-2">
                  {plan.highlights.map((h, i) => (
                    <li key={i} className="text-sm text-stone-600 font-light">— {h}</li>
                  ))}
                </ul>
              </div>
              <button className="w-full py-2.5 border border-stone-800 text-stone-800 hover:bg-stone-800 hover:text-white transition-colors font-light tracking-wide">
                Select
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-10">
          <button className="px-6 py-3 text-stone-500 hover:text-stone-700 font-light tracking-wide">Back</button>
          <button className="flex-1 py-3 text-stone-500 hover:text-stone-700 font-light tracking-wide">Decline</button>
        </div>
      </div>
    </div>
  );
}

function Style9Offer() {
  return (
    <div className="w-full max-w-md bg-stone-50 rounded-lg shadow-xl overflow-hidden">
      <div className="px-8 py-6 border-b border-stone-200">
        <div className="flex items-center justify-between">
          <span className="text-sm tracking-[0.2em] text-stone-500 uppercase">Special Offer</span>
          <button className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="px-8 py-8">
        <h2 className="text-3xl font-serif text-stone-800 mb-3">A parting gift</h2>
        <p className="text-stone-500 mb-8 font-light">We'd love for you to stay with us.</p>
        <div className="bg-white p-8 rounded-lg border border-stone-200 text-center">
          <p className="text-sm tracking-[0.2em] text-stone-500 uppercase mb-4">Exclusive Offer</p>
          <p className="text-5xl font-serif text-stone-800 mb-2">50% Off</p>
          <p className="text-stone-500 font-light mb-8">for three months</p>
          <button className="w-full py-3 bg-stone-800 text-white hover:bg-stone-900 font-light tracking-wide">
            Accept Offer
          </button>
        </div>
        <div className="flex gap-4 mt-10">
          <button className="px-6 py-3 text-stone-500 hover:text-stone-700 font-light tracking-wide">Back</button>
          <button className="flex-1 py-3 text-stone-500 hover:text-stone-700 font-light tracking-wide">No, thank you</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT DRAWER VARIANTS (Mobile) - Applied to each style
// ============================================================================
interface DrawerProps {
  styleId: number;
  modalType: 'feedback' | 'plans' | 'offer';
}

function CompactDrawer({ styleId, modalType }: DrawerProps) {
  const [selected, setSelected] = useState<string | null>(null);

  // Get style-specific colors
  const styleColors: Record<number, { primary: string; bg: string; accent: string }> = {
    1: { primary: 'bg-purple-500', bg: 'bg-purple-50', accent: 'text-purple-600' },
    2: { primary: 'bg-gray-900', bg: 'bg-gray-50', accent: 'text-gray-900' },
    3: { primary: 'bg-gradient-to-r from-violet-500 to-purple-600', bg: 'bg-violet-50', accent: 'text-violet-600' },
    4: { primary: 'bg-black', bg: 'bg-yellow-300', accent: 'text-black' },
    5: { primary: 'bg-gradient-to-r from-purple-500 to-pink-500', bg: 'bg-gray-800', accent: 'text-purple-400' },
    6: { primary: 'bg-rose-500', bg: 'bg-rose-50', accent: 'text-rose-600' },
    7: { primary: 'bg-slate-900', bg: 'bg-slate-50', accent: 'text-slate-900' },
    8: { primary: 'bg-gradient-to-r from-indigo-500 to-purple-500', bg: 'bg-indigo-50', accent: 'text-indigo-600' },
    9: { primary: 'bg-stone-800', bg: 'bg-stone-50', accent: 'text-stone-800' },
  };

  const colors = styleColors[styleId] || styleColors[1];
  const isDark = styleId === 5;

  if (modalType === 'feedback') {
    return (
      <div className={`w-full max-w-sm ${isDark ? 'bg-gray-900' : 'bg-white'} rounded-t-3xl shadow-2xl overflow-hidden`}>
        <div className="flex justify-center pt-3 pb-2">
          <div className={`w-10 h-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full`} />
        </div>
        <div className="px-5 pb-6">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-center`}>
            {styleId === 8 ? 'Why are you leaving? 💔' : 'Why are you leaving?'}
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center mb-4`}>Select a reason</p>
          <div className="space-y-2">
            {SAMPLE_OPTIONS.map((opt, idx) => (
              <button key={opt.id} onClick={() => setSelected(opt.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left text-sm ${
                  selected === opt.id
                    ? `${colors.primary} text-white`
                    : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                <span>{styleId === 8 ? `${['💰', '😴', '🤔', '👀'][idx]} ${opt.label}` : opt.label}</span>
                {selected === opt.id && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
          <button className={`w-full mt-4 py-3 rounded-xl font-semibold text-white ${colors.primary}`}>
            Continue
          </button>
          <button className={`w-full mt-2 py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Cancel</button>
        </div>
      </div>
    );
  }

  if (modalType === 'plans') {
    return (
      <div className={`w-full max-w-sm ${isDark ? 'bg-gray-900' : 'bg-white'} rounded-t-3xl shadow-2xl overflow-hidden`}>
        <div className="flex justify-center pt-3 pb-2">
          <div className={`w-10 h-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full`} />
        </div>
        <div className="px-5 pb-6">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-center`}>
            {styleId === 8 ? '80% Off Plans 🤫' : '80% Off Plans'}
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center mb-4`}>Exclusive deals for you</p>
          <div className="space-y-3">
            {SAMPLE_PLANS.map((plan, idx) => (
              <div key={plan.id} className={`p-4 rounded-xl border-2 ${
                idx === 1
                  ? `${isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50'}`
                  : isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                  <div className="text-right">
                    <span className={`text-xl font-bold ${isDark ? 'text-white' : ''}`}>${getDiscountedPrice(plan.originalPrice, plan.discountPercent)}</span>
                    <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs`}>{plan.period}</span>
                  </div>
                </div>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mb-3`}>{plan.highlights.join(' • ')}</p>
                <button className={`w-full py-2 rounded-lg text-sm font-medium ${
                  idx === 1 ? `${colors.primary} text-white` : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>Select</button>
              </div>
            ))}
          </div>
          <button className={`w-full mt-4 py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Skip</button>
        </div>
      </div>
    );
  }

  // Offer
  return (
    <div className={`w-full max-w-sm ${isDark ? 'bg-gray-900' : 'bg-white'} rounded-t-3xl shadow-2xl overflow-hidden`}>
      <div className="flex justify-center pt-3 pb-2">
        <div className={`w-10 h-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full`} />
      </div>
      <div className="px-5 pb-6">
        <div className="text-center py-4">
          <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-orange-500/20' : colors.bg} flex items-center justify-center mx-auto mb-3`}>
            {styleId === 8 ? <span className="text-3xl">🎉</span> : <Gift className={`h-8 w-8 ${colors.accent}`} />}
          </div>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {styleId === 8 ? '50% Off! 🎁' : '50% Off!'}
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>for 3 months</p>
        </div>
        <button className={`w-full py-3 rounded-xl font-semibold text-white ${colors.primary}`}>
          {styleId === 8 ? 'Yes please! 🎁' : 'Accept Offer'}
        </button>
        <button className={`w-full mt-2 py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
          {styleId === 8 ? 'No thanks 😔' : 'No thanks, cancel subscription'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STYLE DEFINITIONS
// ============================================================================
const STYLES = [
  { id: 1, name: 'Classic Card', description: 'The original Exit Loop design with colored headers and rounded cards' },
  { id: 2, name: 'Minimal Flat', description: 'Clean, flat design with step indicators and subtle borders' },
  { id: 3, name: 'Glassmorphism', description: 'Frosted glass effect with gradients and soft shadows' },
  { id: 4, name: 'Brutalist', description: 'Bold, high-contrast design with thick borders and hard shadows' },
  { id: 5, name: 'Dark Mode Premium', description: 'Sleek dark interface with gradient accents' },
  { id: 6, name: 'Soft Rounded', description: 'Extra rounded corners with pastel backgrounds and gentle shadows' },
  { id: 7, name: 'Corporate Sharp', description: 'Professional design with step progress and sharp corners' },
  { id: 8, name: 'Playful', description: 'Fun design with emojis, bright gradients, and bouncy interactions' },
  { id: 9, name: 'Elegant Serif', description: 'Sophisticated typography with serif fonts and neutral tones' },
];

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
function DesignShowcaseContent() {
  const searchParams = useSearchParams();
  const [selectedStyle, setSelectedStyle] = useState(1);
  const [activeModal, setActiveModal] = useState<'feedback' | 'plans' | 'offer'>('feedback');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Handle URL parameter for style selection
  useEffect(() => {
    const styleParam = searchParams.get('style');
    if (styleParam) {
      const styleId = parseInt(styleParam, 10);
      if (styleId >= 1 && styleId <= 9) {
        setSelectedStyle(styleId);
      }
    }
  }, [searchParams]);

  const renderDesktopModal = (styleId: number, modalType: 'feedback' | 'plans' | 'offer') => {
    const components: Record<number, Record<string, React.ReactNode>> = {
      1: { feedback: <Style1Feedback />, plans: <Style1Plans />, offer: <Style1Offer /> },
      2: { feedback: <Style2Feedback />, plans: <Style2Plans />, offer: <Style2Offer /> },
      3: { feedback: <Style3Feedback />, plans: <Style3Plans />, offer: <Style3Offer /> },
      4: { feedback: <Style4Feedback />, plans: <Style4Plans />, offer: <Style4Offer /> },
      5: { feedback: <Style5Feedback />, plans: <Style5Plans />, offer: <Style5Offer /> },
      6: { feedback: <Style6Feedback />, plans: <Style6Plans />, offer: <Style6Offer /> },
      7: { feedback: <Style7Feedback />, plans: <Style7Plans />, offer: <Style7Offer /> },
      8: { feedback: <Style8Feedback />, plans: <Style8Plans />, offer: <Style8Offer /> },
      9: { feedback: <Style9Feedback />, plans: <Style9Plans />, offer: <Style9Offer /> },
    };
    return components[styleId]?.[modalType] || components[1][modalType];
  };

  const currentStyle = STYLES.find(s => s.id === selectedStyle) || STYLES[0];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Cancel Flow Design Styles
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          9 unique design styles for the 3-step cancel flow — Desktop & Mobile views
        </p>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 h-[calc(100vh-73px)] overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Select Style</h2>
          <div className="space-y-2">
            {STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedStyle === style.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <p className={`font-medium text-sm ${
                  selectedStyle === style.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                }`}>
                  #{style.id} {style.name}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{style.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto h-[calc(100vh-73px)]">
          {/* Controls Row */}
          <div className="flex items-center justify-between mb-6">
            {/* Modal Type Tabs */}
            <div className="flex gap-2">
              {(['feedback', 'plans', 'offer'] as const).map((modal) => (
                <button
                  key={modal}
                  onClick={() => setActiveModal(modal)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    activeModal === modal
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {modal === 'feedback' && 'Feedback'}
                  {modal === 'plans' && 'Plans'}
                  {modal === 'offer' && 'Offer'}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'desktop'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Monitor className="h-4 w-4" />
                Desktop
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'mobile'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                Mobile
              </button>
            </div>
          </div>

          {/* Style Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Style #{currentStyle.id}: {currentStyle.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{currentStyle.description}</p>
          </div>

          {/* Modal Preview */}
          <div className={`flex justify-center p-8 rounded-2xl ${
            selectedStyle === 5 ? 'bg-gray-950' : 'bg-gray-200 dark:bg-gray-700'
          }`}>
            {viewMode === 'desktop' ? (
              renderDesktopModal(selectedStyle, activeModal)
            ) : (
              <div className="relative">
                {/* Phone Frame */}
                <div className="w-[375px] h-[700px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="w-full h-full bg-gray-100 rounded-[2.5rem] overflow-hidden relative">
                    {/* Status Bar */}
                    <div className="h-12 bg-white flex items-center justify-center">
                      <div className="w-20 h-6 bg-black rounded-full" />
                    </div>
                    {/* Content Area - modal slides up from bottom */}
                    <div className="absolute bottom-0 left-0 right-0">
                      <CompactDrawer styleId={selectedStyle} modalType={activeModal} />
                    </div>
                    {/* Backdrop */}
                    <div className="absolute inset-0 top-12 bg-black/30 -z-10" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Side by Side Comparison */}
          <div className="mt-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Desktop vs Mobile</h3>
            <div className={`grid grid-cols-2 gap-8 p-6 rounded-2xl ${
              selectedStyle === 5 ? 'bg-gray-950' : 'bg-gray-200 dark:bg-gray-700'
            }`}>
              {/* Desktop */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Monitor className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Desktop</span>
                </div>
                <div className="transform scale-[0.55] origin-top-left">
                  {renderDesktopModal(selectedStyle, activeModal)}
                </div>
              </div>
              {/* Mobile */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Smartphone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Mobile (Compact Drawer)</span>
                </div>
                <div className="transform scale-[0.7] origin-top-left">
                  <CompactDrawer styleId={selectedStyle} modalType={activeModal} />
                </div>
              </div>
            </div>
          </div>

          {/* All Modals */}
          <div className="mt-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">All Modals — {viewMode === 'desktop' ? 'Desktop' : 'Mobile'}</h3>
            <div className={`grid grid-cols-3 gap-4 p-6 rounded-2xl ${
              selectedStyle === 5 ? 'bg-gray-950' : 'bg-gray-200 dark:bg-gray-700'
            }`}>
              {(['feedback', 'plans', 'offer'] as const).map((modal) => (
                <div key={modal} className="flex flex-col items-center">
                  <span className="text-xs font-medium text-gray-500 mb-3 capitalize">{modal}</span>
                  <div className={`transform ${viewMode === 'desktop' ? 'scale-[0.5]' : 'scale-[0.65]'} origin-top`}>
                    {viewMode === 'desktop'
                      ? renderDesktopModal(selectedStyle, modal)
                      : <CompactDrawer styleId={selectedStyle} modalType={modal} />
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense boundary for useSearchParams
export default function DesignShowcasePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <DesignShowcaseContent />
    </Suspense>
  );
}
