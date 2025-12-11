'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Check,
  Zap,
  Menu,
  X,
  Play,
  ChevronDown,
  Users,
  CreditCard,
  TrendingUp,
  PieChart,
  RefreshCcw,
  Rocket,
  HeartHandshake,
  Layers,
  CircleSlash,
  Brain,
  Target,
  MessageSquare,
  Globe,
  Mail,
  Building2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CancelFlowModal } from '@/components/CancelFlowModal';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const { user } = useAuth();

  const handleDemoClick = () => {
    setShowDemoModal(true);
  };

  const features = [
    {
      title: "Cancellation Flows",
      description: "Intercept cancellations with customizable flows. Offer alternatives like discounts, pauses, or downgrades before users leave.",
      icon: CircleSlash,
      color: 'purple', // purple accent
    },
    {
      title: "Email Sequences",
      description: "Automated email campaigns to win back churned users and re-engage at-risk customers with personalized messaging.",
      icon: Mail,
      color: 'green', // green accent
    },
    {
      title: "Churn Radar",
      description: "AI-powered early warning system that identifies at-risk customers before they cancel, so you can act proactively.",
      icon: Target,
      color: 'amber', // yellow/amber accent
    },
    {
      title: "Customer Intelligence",
      description: "Complete customer profiles with billing history, engagement data, and churn risk scores - all in one place.",
      icon: Users,
      color: 'purple', // purple accent
    },
  ];

  const faqs = [
    {
      question: "What Kind Of Teams Use ExitLoop?",
      answer: "SaaS startups and growing subscription businesses use ExitLoop to reduce churn and retain more customers. If you have a cancel button, you need ExitLoop."
    },
    {
      question: "Does ExitLoop Work With Quick And Advanced Stacks?",
      answer: "We integrate with popular billing and analytics tools and can start simple even if your stack is messy. Start small, improve over time."
    },
    {
      question: "Is There A Free Trial?",
      answer: "Yes! You can start with our free tier to test ExitLoop with your cancel flows. No credit card required to get started."
    },
    {
      question: "What Is The ROI?",
      answer: "Most teams see positive ROI within the first month. Even saving one customer typically pays for ExitLoop many times over."
    },
    {
      question: "Can I Collaborate With My Engineering Team Inside ExitLoop?",
      answer: "You might need a dev once to connect billing or events. After that, product or growth can manage flows and copy without code."
    },
    {
      question: "Does ExitLoop Support Multi-Channel Communication?",
      answer: "Yes, ExitLoop can trigger follow-up emails, in-app messages, and integrate with your existing communication tools."
    },
    {
      question: "Can I Customize How ExitLoop Works For My Team?",
      answer: "ExitLoop is fully customizable - from the look and feel of modals to the retention offers and targeting rules."
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 w-full">
        <div className="container mx-auto px-6 lg:px-[120px] flex h-24 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/img/logo.svg"
              alt="ExitLoop"
              width={140}
              height={28}
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How it works</Link>
            <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
            <Link href="#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">FAQ</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Globe className="h-5 w-5 text-gray-500" />
            {user ? (
              <Button asChild className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-full px-6">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-full px-6">
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t p-4 bg-white absolute w-full shadow-lg">
            <div className="flex flex-col space-y-4">
              <Link href="#features" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Features</Link>
              <Link href="#how-it-works" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>How it works</Link>
              <Link href="#pricing" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
              <Link href="#faq" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>FAQ</Link>
              <div className="pt-4 border-t flex flex-col gap-3">
                {user ? (
                  <Button asChild className="w-full">
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>Go to Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Link href="/login" className="text-sm font-medium text-center" onClick={() => setIsMenuOpen(false)}>Log in</Link>
                    <Button asChild className="w-full">
                      <Link href="/signup" onClick={() => setIsMenuOpen(false)}>Start free</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[1200px] overflow-hidden">
          {/* Hero Image Placeholder - Top portion */}
          <div className="absolute top-0 left-0 right-0 h-[900px] bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
            {/* Placeholder for hero background image */}
            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
              <span className="text-sm">[Hero Background Image Placeholder]</span>
            </div>
          </div>

          {/* Curved white background overlay */}
          <div className="absolute top-[188px] left-0 right-0 bottom-0">
            <svg
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[1720px] h-[802px]"
              viewBox="0 0 1720 802"
              fill="none"
              preserveAspectRatio="none"
            >
              <ellipse cx="860" cy="802" rx="860" ry="802" fill="white" />
            </svg>
            <div className="absolute top-[133px] left-0 right-0 bottom-0 bg-white" />
          </div>

          {/* Content */}
          <div className="relative z-10 pt-[176px] px-6 lg:px-[120px]">
            <div className="max-w-[984px] mx-auto text-center">
              {/* Social Proof Badge */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 border-2 border-white" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-white" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-white" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 border-2 border-white" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 border-2 border-white" />
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < 4 ? 'text-amber-400' : 'text-amber-400/50'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-500 text-sm italic">Loved by 1,400+ SaaS founders</span>
              </div>

              {/* Main Title */}
              <h1 className="text-5xl md:text-6xl lg:text-[68px] font-bold tracking-tight leading-[1.1] text-gray-900 mb-6">
                Grow Without
                <br />
                <span className="bg-gradient-to-r from-violet-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">Leaks.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-gray-500 max-w-[780px] mx-auto mb-10 leading-relaxed">
                ExitLoop intercepts cancellations in real time and guides customers toward smarter options like downgrading or staying. <span className="underline decoration-2 underline-offset-4">Save more customers, keep more MRR.</span>
              </p>

              {/* CTA Button */}
              <div className="flex justify-center">
                <Button size="lg" className="bg-violet-500 hover:bg-violet-600 text-white rounded-full px-8 h-12 text-base" asChild>
                  <Link href="/signup">Start 7-day free trial</Link>
                </Button>
              </div>
            </div>

            {/* Browser Mockup */}
            <div className="mt-16 max-w-[1128px] mx-auto">
              <div className="relative rounded-xl overflow-hidden shadow-2xl bg-white border border-gray-200">
                {/* Browser Chrome */}
                <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white rounded-full px-4 py-1.5 flex items-center gap-2 text-sm text-gray-500 border border-gray-200 min-w-[300px] justify-center">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      yourdomain.com
                    </div>
                  </div>
                  <div className="flex gap-3 text-gray-400">
                    <div className="w-5 h-5" />
                    <div className="w-5 h-5" />
                    <div className="w-5 h-5" />
                  </div>
                </div>

                {/* Browser Content - Placeholder */}
                <div className="aspect-[1112/695] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Play className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-400 text-lg">[Product Screenshot / Demo Video Placeholder]</p>
                    <p className="text-gray-300 text-sm mt-2">1112 x 695 px recommended</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* White to section transition */}
          <div className="absolute bottom-0 left-0 right-0 h-[322px] bg-white" />
        </section>

        {/* Logos Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-6 lg:px-[120px]">
            <p className="text-center text-gray-500 text-lg mb-10">
              Trusted by scrappy SaaS teams, including yours
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
              {/* Logo placeholders */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-xs">Logo</span>
                  </div>
                  <span className="font-semibold text-gray-700">Company {i}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white">
          <div className="container mx-auto px-6 lg:px-[120px]">
            {/* Section Header */}
            <div className="text-center max-w-[801px] mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">
                Deliver instant support everywhere.
                <br />
                From one place
              </h2>
              <p className="text-xl text-gray-500">
                No enterprise pricing, no engineering marathon. Start saving customers in minutes, not months.
              </p>
            </div>

            {/* Features Grid - 2x2 */}
            <div className="grid md:grid-cols-2 gap-8 max-w-[1240px] mx-auto">
              {features.map((feature, index) => {
                const colorClasses = {
                  purple: {
                    bg: 'from-violet-50/50 to-purple-50/30',
                    circle1: 'from-violet-100/50',
                    circle2: 'from-purple-100/50',
                    icon: 'text-violet-500',
                    iconBg: 'bg-violet-100',
                    avatarBg: 'bg-violet-200',
                    avatarText: 'text-violet-700',
                  },
                  green: {
                    bg: 'from-emerald-50/50 to-green-50/30',
                    circle1: 'from-emerald-100/50',
                    circle2: 'from-green-100/50',
                    icon: 'text-emerald-500',
                    iconBg: 'bg-emerald-100',
                    avatarBg: 'bg-emerald-200',
                    avatarText: 'text-emerald-700',
                  },
                  amber: {
                    bg: 'from-amber-50/50 to-yellow-50/30',
                    circle1: 'from-amber-100/50',
                    circle2: 'from-yellow-100/50',
                    icon: 'text-amber-500',
                    iconBg: 'bg-amber-100',
                    avatarBg: 'bg-amber-200',
                    avatarText: 'text-amber-700',
                  },
                };
                const colors = colorClasses[feature.color as keyof typeof colorClasses];

                return (
                  <div
                    key={index}
                    className={`relative bg-gradient-to-br ${colors.bg} rounded-2xl p-10 min-h-[520px] overflow-hidden`}
                  >
                    {/* Decorative circles */}
                    <div className={`absolute -top-[200px] -left-[100px] w-[400px] h-[400px] rounded-full bg-gradient-to-br ${colors.circle1} to-transparent`} />
                    <div className={`absolute -bottom-[200px] -right-[100px] w-[400px] h-[400px] rounded-full bg-gradient-to-br ${colors.circle2} to-transparent`} />

                    <div className="relative z-10 h-full flex flex-col">
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-gray-500 max-w-[400px]">{feature.description}</p>
                      </div>

                      {/* Feature visual - different for each feature */}
                      <div className="flex-1 flex items-center justify-center relative">
                        {index === 0 && (
                          /* Cancellation Flows - Modal preview */
                          <div className="relative w-full max-w-[320px]">
                            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
                              <div className="text-center mb-4">
                                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <CircleSlash className="w-5 h-5 text-violet-500" />
                                </div>
                                <h4 className="font-semibold text-gray-900 text-sm">Before you go...</h4>
                                <p className="text-xs text-gray-500 mt-1">Would you consider an alternative?</p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-3 p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  </div>
                                  <span className="text-xs font-medium text-gray-700">50% off for 3 months</span>
                                </div>
                                <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                    <RefreshCcw className="w-3 h-3 text-gray-600" />
                                  </div>
                                  <span className="text-xs text-gray-600">Pause subscription</span>
                                </div>
                              </div>
                            </div>
                            {/* Cursor with comment */}
                            <div className="absolute -bottom-2 -right-4">
                              <div className="flex items-end gap-1">
                                <svg className="w-4 h-4 text-violet-500" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.28 0 .5-.22.5-.5V3.21c0-.28-.22-.5-.5-.5H6c-.28 0-.5.22-.5.5Z"/>
                                </svg>
                                <div className="bg-violet-500 text-white text-[10px] px-2 py-1 rounded-lg rounded-bl-none shadow-sm">
                                  Saved! 🎉
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {index === 1 && (
                          /* Email Sequences - Email cards */
                          <div className="relative w-full max-w-[320px]">
                            <div className="space-y-3">
                              <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 transform -rotate-2">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-emerald-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-900">Day 1: We miss you!</p>
                                    <p className="text-[10px] text-gray-500">Sent • 89% open rate</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 transform rotate-1 ml-4">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-amber-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-900">Day 3: Special offer inside</p>
                                    <p className="text-[10px] text-gray-500">Scheduled • 2:00 PM</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 transform -rotate-1 ml-2">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-violet-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-900">Day 7: Last chance</p>
                                    <p className="text-[10px] text-gray-500">Draft</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {index === 2 && (
                          /* Churn Radar - Risk indicators */
                          <div className="relative w-full max-w-[320px]">
                            <div className="bg-white rounded-xl shadow-xl p-5 border border-gray-100">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-semibold text-gray-700">At-Risk Customers</span>
                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">3 alerts</span>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 p-2 rounded-lg bg-red-50 border border-red-100">
                                  <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center text-xs font-semibold text-red-700">JK</div>
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-900">John K.</p>
                                    <p className="text-[10px] text-red-600">High risk • No login 14 days</p>
                                  </div>
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                </div>
                                <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-50 border border-amber-100">
                                  <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center text-xs font-semibold text-amber-700">SM</div>
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-900">Sarah M.</p>
                                    <p className="text-[10px] text-amber-600">Medium risk • Usage down 60%</p>
                                  </div>
                                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                </div>
                                <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-50 border border-amber-100">
                                  <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center text-xs font-semibold text-amber-700">RT</div>
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-900">Robert T.</p>
                                    <p className="text-[10px] text-amber-600">Medium risk • Payment failed</p>
                                  </div>
                                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {index === 3 && (
                          /* Customer Intelligence - Customer profile */
                          <div className="relative w-full max-w-[320px]">
                            <div className="bg-white rounded-xl shadow-xl p-5 border border-gray-100">
                              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                                <div className="w-12 h-12 bg-violet-200 rounded-full flex items-center justify-center text-sm font-semibold text-violet-700">AJ</div>
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm">Alex Johnson</p>
                                  <p className="text-xs text-gray-500">alex@company.com</p>
                                </div>
                                <div className="ml-auto">
                                  <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">Active</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-lg p-2.5">
                                  <p className="text-[10px] text-gray-500">MRR</p>
                                  <p className="text-sm font-semibold text-gray-900">$149/mo</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-2.5">
                                  <p className="text-[10px] text-gray-500">Plan</p>
                                  <p className="text-sm font-semibold text-gray-900">Growth</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-2.5">
                                  <p className="text-[10px] text-gray-500">Customer Since</p>
                                  <p className="text-sm font-semibold text-gray-900">8 months</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-2.5">
                                  <p className="text-[10px] text-gray-500">Health Score</p>
                                  <p className="text-sm font-semibold text-emerald-600">92/100</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Integration Section with Stripe */}
        <section id="how-it-works" className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
          {/* Dot Pattern Background */}
          <div className="absolute inset-0 opacity-30">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, #d1d5db 1.5px, transparent 1.5px)`,
                backgroundSize: '24px 24px',
              }}
            />
          </div>

          <div className="container mx-auto px-6 lg:px-[120px] relative z-10">
            <div className="text-center max-w-[800px] mx-auto">
              <div className="w-20 h-20 mx-auto mb-8 bg-[#635bff] rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                </svg>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">
                Integrate effortlessly
                <br />
                with Stripe
              </h2>
              <p className="text-xl text-gray-500 max-w-[600px] mx-auto">
                Connect your Stripe account in minutes. ExitLoop automatically syncs with your subscriptions, customers, and billing events.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-gradient-to-br from-violet-500 via-emerald-400 to-amber-400 relative overflow-hidden">
          {/* Cloud-like decorations */}
          <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-white/5 rounded-full blur-3xl" />

          <div className="container mx-auto px-6 lg:px-[120px] relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
                Simple, Scalable Pricing
              </h2>
              <p className="text-xl text-white/80">
                All plans include a 14-day free trial. No credit card required.
              </p>
            </div>

            {/* Pricing Cards - 3 columns */}
            <div className="grid md:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
              {/* Basic Plan */}
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-violet-500" />
                </div>
                <div className="mb-6">
                  <span className="text-lg font-semibold text-gray-900">Basic</span>
                  <p className="text-sm text-gray-500 mt-1">Perfect for small SaaS products</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">$9</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    '1 Cancel Flow',
                    'Exit survey collection',
                    'Analytics',
                    'Email support',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-600 text-sm">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                  <li className="flex items-center gap-3 text-gray-400 text-sm">
                    <span className="w-5 h-5 flex-shrink-0 text-center">-</span>
                    No Email Sequences
                  </li>
                </ul>

                <Button variant="outline" className="w-full rounded-full h-11 border-gray-300" asChild>
                  <Link href="/signup">Start Free Trial</Link>
                </Button>
              </div>

              {/* Growth Plan - Popular */}
              <div className="bg-white rounded-2xl p-8 shadow-xl relative border-2 border-violet-500 scale-105">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="mb-6">
                  <span className="text-lg font-semibold text-gray-900">Growth</span>
                  <p className="text-sm text-gray-500 mt-1">For growing businesses</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">$19</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    '5 Cancel Flows',
                    'Email Sequences',
                    'Custom exit surveys',
                    'Analytics',
                    'Priority support',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-600 text-sm">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Button className="w-full bg-violet-500 hover:bg-violet-600 text-white rounded-full h-11" asChild>
                  <Link href="/signup">Start Free Trial</Link>
                </Button>
              </div>

              {/* Scale Plan */}
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-amber-500" />
                </div>
                <div className="mb-6">
                  <span className="text-lg font-semibold text-gray-900">Scale</span>
                  <p className="text-sm text-gray-500 mt-1">Unlimited flexibility</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">$49</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    'Unlimited Cancel Flows',
                    'Email Sequences',
                    'Custom exit surveys',
                    'Analytics',
                    'Priority support',
                    'API access',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-600 text-sm">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Button variant="outline" className="w-full rounded-full h-11 border-gray-300" asChild>
                  <Link href="/signup">Start Free Trial</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 lg:px-[120px]">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
                What Teams Are Saying
              </h2>
              <p className="text-xl text-gray-500">
                Join hundreds of SaaS founders reducing churn with ExitLoop
              </p>
            </div>

            {/* 3 Testimonials Grid */}
            <div className="grid md:grid-cols-3 gap-8 max-w-[1200px] mx-auto">
              {/* Testimonial 1 */}
              <div className="bg-gray-50 rounded-2xl p-8">
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-gray-600 leading-relaxed mb-6">
                  "We plugged in ExitLoop and within weeks we were saving accounts that would never have talked to us. It paid for itself almost immediately."
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                    <span className="text-violet-600 font-semibold">JD</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Founder Name</div>
                    <div className="text-sm text-gray-500">CEO, SaaS Company</div>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-gray-50 rounded-2xl p-8">
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-gray-600 leading-relaxed mb-6">
                  "The cancel flow customization is incredible. We reduced our churn by 23% in the first month. The ROI was obvious from day one."
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 font-semibold">SK</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Founder Name</div>
                    <div className="text-sm text-gray-500">Founder, Tech Startup</div>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-gray-50 rounded-2xl p-8">
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-gray-600 leading-relaxed mb-6">
                  "Finally, a churn tool that doesn't require a dedicated engineer. Setup took 30 minutes and we were live. Highly recommend for any SaaS."
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-amber-600 font-semibold">MR</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Founder Name</div>
                    <div className="text-sm text-gray-500">CTO, Software Company</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 bg-gray-50">
          <div className="container mx-auto px-6 lg:px-[120px]">
            <div className="grid md:grid-cols-2 gap-16 max-w-[1200px] mx-auto">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
                  Frequently Asked
                  <br />
                  Questions
                </h2>
                <p className="text-gray-500">
                  Everything you need to know about ExitLoop and how it can help reduce your churn.
                </p>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <button
                      className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
                      onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                    >
                      <span className="font-medium text-gray-900">{faq.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform ${
                          openFaqIndex === index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openFaqIndex === index && (
                      <div className="px-6 pb-5">
                        <p className="text-gray-500">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 bg-gradient-to-br from-violet-500 via-emerald-400 to-amber-400 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl" />
          <div className="container mx-auto px-6 lg:px-[120px] relative z-10">
            <div className="max-w-[800px] mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                Ready to get started?
              </h2>
              <p className="text-xl text-white/80 mb-10">
                Ship your first cancel save flow, watch the first saved customer stay, and never look at your cancel button the same way again.
              </p>
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-8 h-12 text-base font-medium" asChild>
                <Link href="/signup">Start 7-day free trial</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-6 lg:px-[120px]">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Logo and description */}
            <div className="md:col-span-1">
              <Link href="/" className="inline-block mb-4">
                <Image
                  src="/img/logo.svg"
                  alt="ExitLoop"
                  width={120}
                  height={24}
                />
              </Link>
              <p className="text-sm text-gray-500">
                Stop churn before it starts. Save more customers, keep more MRR.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-3">
                <li><Link href="#features" className="text-sm text-gray-500 hover:text-gray-900">Features</Link></li>
                <li><Link href="#pricing" className="text-sm text-gray-500 hover:text-gray-900">Pricing</Link></li>
                <li><Link href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900">How it works</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-sm text-gray-500 hover:text-gray-900">About</Link></li>
                <li><Link href="/blog" className="text-sm text-gray-500 hover:text-gray-900">Blog</Link></li>
                <li><Link href="/contact" className="text-sm text-gray-500 hover:text-gray-900">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} ExitLoop. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      <CancelFlowModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        customerId="demo_customer"
        subscriptionId="demo_sub"
        companyName="ExitLoop"
        onCancelConfirmed={() => setShowDemoModal(false)}
        onOfferAccepted={() => setShowDemoModal(false)}
      />
    </div>
  );
}
