'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Check,
  Menu,
  X,
  Play,
  Zap,
  Shield,
  BarChart3,
  Mail,
  Users,
  Target,
  CircleSlash,
  RefreshCcw,
  Building2,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CancelFlowModal } from '@/components/CancelFlowModal';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const { user } = useAuth();

  const handleDemoClick = () => {
    setShowDemoModal(true);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-black selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-display font-bold text-xl">
                E
              </div>
              <span className="font-display font-bold text-xl tracking-tight uppercase">ExitLoop</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium hover:text-gray-600 transition-colors">Product</Link>
              <Link href="#pricing" className="text-sm font-medium hover:text-gray-600 transition-colors">Pricing</Link>
              <Link href="#company" className="text-sm font-medium hover:text-gray-600 transition-colors">Company</Link>
            </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Button asChild className="bg-black text-white hover:bg-gray-800 rounded-none px-6 font-medium h-9">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:text-gray-600 hidden md:block">Login</Link>
                <Button asChild className="bg-black text-white hover:bg-gray-800 rounded-none px-6 font-medium h-9">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t p-4 bg-white absolute w-full shadow-xl">
            <div className="flex flex-col space-y-4">
              <Link href="#features" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Product</Link>
              <Link href="#pricing" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
              <div className="pt-4 border-t flex flex-col gap-3">
                <Link href="/login" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Login</Link>
                <Link href="/signup" className="text-sm font-medium font-bold" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="pt-24 pb-12 md:pt-32 md:pb-24 px-6 text-center">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-display font-black text-6xl md:text-8xl lg:text-[100px] leading-[0.9] tracking-tight uppercase mb-8">
              The Revenue Operating
              <br />
              System Is Here.
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Stop bleeding revenue. ExitLoop automates retention, recovers failed payments, 
              and turns cancellations into conversations. Finally, every dollar works together.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <Button size="lg" className="bg-black hover:bg-gray-800 text-white rounded-sm h-14 px-8 text-base font-bold uppercase tracking-wide" asChild>
                <Link href="/signup">Start Free Trial</Link>
                </Button>
              <Button size="lg" variant="outline" className="border-2 border-black text-black hover:bg-gray-50 rounded-sm h-14 px-8 text-base font-bold uppercase tracking-wide" onClick={handleDemoClick}>
                  <Play className="w-4 h-4 mr-2" />
                See How It Works
                </Button>
              </div>
            </div>

          {/* Hero Visual - Keyboard/Hand placeholder style */}
          <div className="w-full max-w-[1400px] mx-auto h-[400px] md:h-[600px] bg-gray-900 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/img/bg.png')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
            {/* Abstract overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-10 left-6 md:left-12 text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-white text-xs font-medium mb-4">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 Live System Active
                  </div>
              <h3 className="text-white font-display text-3xl uppercase tracking-tight">Retention Autopilot: <span className="text-green-400">ON</span></h3>
                    </div>
            {/* Play button overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 cursor-pointer group-hover:scale-110 transition-transform duration-300">
               <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                  </div>
        </section>

        {/* VALUES GRID SECTION - Beige */}
        <section className="py-24 bg-[#F8F7F4] border-t border-black/5">
          <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-2xl mb-16">
            <h2 className="font-display font-black text-4xl md:text-5xl uppercase leading-[0.95] tracking-tight mb-6">
              Win more with less friction.
              <span className="text-gray-400 block mt-2">ExitLoop streamlines retention, recovery, and insights so you can focus on building.</span>
            </h2>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {/* Column 1 */}
              <div className="space-y-6">
                <h3 className="font-bold text-lg border-b border-black/10 pb-2">Retention</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                    Custom Cancel Flows
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                    Dynamic Offers
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                    Exit Surveys
                  </li>
                </ul>
                    </div>

              {/* Column 2 */}
              <div className="space-y-6">
                <h3 className="font-bold text-lg border-b border-black/10 pb-2">Recovery</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-1.5 flex-shrink-0" />
                    Dunning Emails
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-1.5 flex-shrink-0" />
                    Card Updates
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-1.5 flex-shrink-0" />
                    Payment Retries
                  </li>
                </ul>
                      </div>

              {/* Column 3 */}
              <div className="space-y-6">
                <h3 className="font-bold text-lg border-b border-black/10 pb-2">Intelligence</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                    Churn Radar
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                    Risk Scoring
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                    Health Snapshots
                  </li>
                </ul>
                        </div>

              {/* Column 4 */}
              <div className="space-y-6">
                <h3 className="font-bold text-lg border-b border-black/10 pb-2">Platform</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0" />
                    Stripe Integration
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0" />
                    API Access
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0" />
                    Webhooks
                  </li>
                </ul>
                  </div>
            </div>
          </div>
        </section>

        {/* DARK SECTION - "Dinosaur" */}
        <section className="py-24 bg-black text-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-3 h-3 bg-white"></div>
              <span className="font-mono text-xs uppercase">The Old Way</span>
            </div>

            <h2 className="font-display font-black text-4xl md:text-6xl uppercase leading-[0.95] tracking-tight mb-16 max-w-3xl">
              Your retention stack is a dinosaur. 
              <span className="text-gray-500 block">Scattered scripts, manual emails, and guessing games.</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="group relative aspect-square bg-[#111] border border-white/10 p-8 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1629757509637-bdc9f58f4138?q=80&w=2929&auto=format&fit=crop')] bg-cover bg-center opacity-20 grayscale group-hover:grayscale-0 transition-all duration-500"></div>
                <div className="relative z-10 h-full flex flex-col justify-end">
                  <h3 className="font-bold text-xl mb-2">The Spreadsheet Nightmare</h3>
                  <p className="text-gray-400 text-sm">Manually tracking cancellations in Excel while customers slip away.</p>
                </div>
                </div>
              
              {/* Card 2 */}
              <div className="group relative aspect-square bg-[#111] border border-white/10 p-8 overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1616628188859-7a11abb6fcc9?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 grayscale group-hover:grayscale-0 transition-all duration-500"></div>
                 <div className="relative z-10 h-full flex flex-col justify-end">
                  <h3 className="font-bold text-xl mb-2">The "Support Ticket"</h3>
                  <p className="text-gray-400 text-sm">Forcing users to email support to cancel. They just get angry.</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="group relative aspect-square bg-[#111] border border-white/10 p-8 overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1531297461136-82lw9b283285?q=80&w=2690&auto=format&fit=crop')] bg-cover bg-center opacity-20 grayscale group-hover:grayscale-0 transition-all duration-500"></div>
                 <div className="relative z-10 h-full flex flex-col justify-end">
                  <h3 className="font-bold text-xl mb-2">The Silent Churn</h3>
                  <p className="text-gray-400 text-sm">Failed payments that go unnoticed until the subscription expires.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE 1 - ORANGE */}
        <section className="py-24 border-b border-black/5">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-block bg-orange-100 text-orange-600 px-3 py-1 text-xs font-bold uppercase mb-6">Retention Flows</div>
                <h2 className="font-display font-black text-5xl md:text-7xl uppercase leading-[0.9] tracking-tight mb-8">
                  Zero in on the<br />
                  buyers who<br />
                  matter.
                </h2>
                <p className="text-lg text-gray-600 max-w-md mb-8">
                  Not all churn is equal. Identify high-value customers and offer them personalized incentives to stay.
              </p>
                <Button variant="outline" className="border-black text-black rounded-none h-12 px-6 uppercase font-bold text-sm hover:bg-black hover:text-white transition-colors">
                  Explore Flows
                </Button>
            </div>

              <div className="relative aspect-square md:aspect-[4/3] bg-orange-500 p-8 md:p-12 flex items-center justify-center">
                {/* Abstract UI representation */}
                <div className="w-full h-full bg-white shadow-2xl relative overflow-hidden flex flex-col">
                  <div className="h-8 bg-gray-50 border-b flex items-center px-4 gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      </div>
                  <div className="p-6 flex-1 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                     <div className="bg-white border border-gray-200 shadow-sm p-4 max-w-xs mx-auto mt-4 rounded-lg">
                       <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                           <CircleSlash size={20} />
                                </div>
                         <div>
                           <div className="text-sm font-bold">Cancellation Attempt</div>
                           <div className="text-xs text-gray-500">High Value Customer</div>
                         </div>
                              </div>
                              <div className="space-y-2">
                         <div className="h-2 bg-gray-100 rounded w-full"></div>
                         <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                                  </div>
                       <div className="mt-4 flex gap-2">
                         <div className="flex-1 bg-black text-white text-xs py-2 text-center font-bold rounded">Offer 20% Off</div>
                         <div className="flex-1 bg-gray-100 text-gray-600 text-xs py-2 text-center font-bold rounded">Pause</div>
                                </div>
                                  </div>
                                </div>
                              </div>
                {/* Decorative sticker */}
                <div className="absolute -bottom-6 -right-6 bg-white border-2 border-black p-4 rotate-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="font-mono text-xs font-bold uppercase">Saved $42,000 MRR</p>
                            </div>
                                </div>
                              </div>
                            </div>
        </section>

        {/* FEATURE 2 - PINK */}
        <section className="py-24 border-b border-black/5 bg-[#FDF2F8]/30">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative aspect-square md:aspect-[4/3] bg-pink-500 p-8 md:p-12 flex items-center justify-center">
                 <div className="w-full h-full bg-white shadow-2xl relative overflow-hidden flex flex-col">
                  <div className="p-8 flex flex-col h-full justify-between bg-[url('/img/grid.svg')]">
                    <div className="space-y-4">
                      {/* Email items */}
                      <div className="bg-white border border-gray-100 shadow-sm p-4 flex items-center gap-4 transform -rotate-1 hover:rotate-0 transition-transform">
                        <div className="w-10 h-10 bg-pink-100 flex items-center justify-center rounded-full text-pink-600"><Mail size={18} /></div>
                                  <div>
                          <div className="font-bold text-sm">Payment Failed</div>
                          <div className="text-xs text-gray-500">Sent immediately</div>
                                  </div>
                        <div className="ml-auto text-xs font-mono bg-gray-100 px-2 py-1">Open: 68%</div>
                                </div>
                      
                      <div className="bg-white border border-gray-100 shadow-sm p-4 flex items-center gap-4 transform rotate-1 hover:rotate-0 transition-transform ml-8">
                         <div className="w-10 h-10 bg-purple-100 flex items-center justify-center rounded-full text-purple-600"><Mail size={18} /></div>
                                  <div>
                          <div className="font-bold text-sm">Last Chance</div>
                          <div className="text-xs text-gray-500">Sent day 3</div>
                                  </div>
                         <div className="ml-auto text-xs font-mono bg-gray-100 px-2 py-1">Recovered</div>
                                </div>
                              </div>

                    <div className="mt-8">
                       <div className="text-xs font-bold uppercase text-gray-400 mb-2">Campaign Performance</div>
                       <div className="h-32 flex items-end gap-2">
                         <div className="flex-1 bg-pink-200 h-[40%] rounded-t-sm"></div>
                         <div className="flex-1 bg-pink-300 h-[65%] rounded-t-sm"></div>
                         <div className="flex-1 bg-pink-400 h-[50%] rounded-t-sm"></div>
                         <div className="flex-1 bg-pink-500 h-[85%] rounded-t-sm"></div>
                         <div className="flex-1 bg-pink-600 h-[70%] rounded-t-sm"></div>
                              </div>
                                  </div>
                                </div>
                                  </div>
                                </div>
              
              <div className="order-1 lg:order-2">
                <div className="inline-block bg-pink-100 text-pink-600 px-3 py-1 text-xs font-bold uppercase mb-6">Recovery Automation</div>
                <h2 className="font-display font-black text-5xl md:text-7xl uppercase leading-[0.9] tracking-tight mb-8">
                  Recover Revenue<br />
                  Without The<br />
                  Patchwork.
                </h2>
                <p className="text-lg text-gray-600 max-w-md mb-8">
                  Automated dunning that actually sounds human. Recover failed payments and re-engage churned users with zero manual effort.
                </p>
                <Button variant="outline" className="border-black text-black rounded-none h-12 px-6 uppercase font-bold text-sm hover:bg-black hover:text-white transition-colors">
                  See Automations
                </Button>
                                </div>
            </div>
          </div>
        </section>

        {/* FEATURE 3 - GREEN */}
        <section className="py-24 border-b border-black/5">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-block bg-green-100 text-green-700 px-3 py-1 text-xs font-bold uppercase mb-6">Churn Radar</div>
                <h2 className="font-display font-black text-5xl md:text-7xl uppercase leading-[0.9] tracking-tight mb-8">
                  Turn Signals<br />
                  Into<br />
                  Saves.
                </h2>
                <p className="text-lg text-gray-600 max-w-md mb-8">
                  Predict churn before it happens. Our AI analyzes usage patterns to flag at-risk customers so you can intervene.
              </p>
                <Button variant="outline" className="border-black text-black rounded-none h-12 px-6 uppercase font-bold text-sm hover:bg-black hover:text-white transition-colors">
                  View Radar
                </Button>
            </div>
              
              <div className="relative aspect-square md:aspect-[4/3] bg-green-500 p-8 md:p-12 flex items-center justify-center">
                <div className="w-full h-full bg-black shadow-2xl relative overflow-hidden flex flex-col p-6">
                   <div className="flex items-center justify-between mb-6">
                     <div className="text-white font-mono text-sm">LIVE FEED</div>
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>

                   <div className="space-y-4">
                     {[1, 2, 3].map((i) => (
                       <div key={i} className="bg-[#222] p-4 border-l-4 border-green-500 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white text-xs">U{i}</div>
                           <div>
                             <div className="text-white text-sm font-bold">User {i}249</div>
                             <div className="text-gray-400 text-xs">Usage dropped 40%</div>
                </div>
              </div>
                         <div className="text-green-400 text-xs font-bold uppercase tracking-wide">High Risk</div>
                </div>
                     ))}
              </div>

                   <div className="mt-auto bg-[#222] p-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>Health Score</span>
                        <span>84/100</span>
                </div>
                      <div className="h-1 bg-gray-700 w-full overflow-hidden">
                        <div className="h-full bg-green-500 w-[84%]"></div>
              </div>
            </div>
          </div>
                 {/* Decorative sticker */}
                <div className="absolute -top-6 -left-6 bg-yellow-400 border-2 border-black p-3 -rotate-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10">
                  <p className="font-display text-lg font-black uppercase">Early Warning</p>
            </div>
                </div>
                  </div>
                </div>
        </section>

        {/* FEATURE 4 - YELLOW */}
        <section className="py-24 border-b border-black/5 bg-[#FEFCE8]/50">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative aspect-square md:aspect-[4/3] bg-yellow-400 p-8 md:p-12 flex items-center justify-center">
                 <div className="w-full h-full bg-white shadow-2xl relative overflow-hidden flex flex-col p-8">
                   <div className="font-display font-black text-2xl uppercase mb-6">Revenue saved</div>
                   <div className="flex-1 flex items-end gap-4 pb-4 border-b-2 border-black">
                     <div className="w-1/5 bg-gray-200 h-[20%] relative group">
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">$1.2k</div>
              </div>
                     <div className="w-1/5 bg-gray-300 h-[35%] relative group">
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">$2.4k</div>
                </div>
                     <div className="w-1/5 bg-gray-400 h-[45%] relative group">
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">$3.1k</div>
                </div>
                     <div className="w-1/5 bg-black h-[70%] relative group">
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">$5.8k</div>
                  </div>
                     <div className="w-1/5 bg-yellow-500 h-[90%] relative group">
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">$8.2k</div>
                </div>
              </div>
                   <div className="flex justify-between mt-4 text-sm font-bold">
                     <span>Jan</span>
                     <span>Feb</span>
                     <span>Mar</span>
                     <span>Apr</span>
                     <span>May</span>
                </div>
                  </div>
                </div>

              <div className="order-1 lg:order-2">
                <div className="inline-block bg-yellow-100 text-yellow-700 px-3 py-1 text-xs font-bold uppercase mb-6">Analytics</div>
                <h2 className="font-display font-black text-5xl md:text-7xl uppercase leading-[0.9] tracking-tight mb-8">
                  Operate From A<br />
                  Single Source<br />
                  Of Truth.
                </h2>
                <p className="text-lg text-gray-600 max-w-md mb-8">
                  No more arguing over spreadsheets. See exactly how much revenue you've saved, recovered, and retained in real-time.
                </p>
                <Button variant="outline" className="border-black text-black rounded-none h-12 px-6 uppercase font-bold text-sm hover:bg-black hover:text-white transition-colors">
                  See Dashboard
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-24 bg-[#F8F7F4]">
          <div className="container mx-auto px-6 lg:px-12">
            <h2 className="font-display font-black text-4xl md:text-5xl uppercase leading-[0.9] tracking-tight mb-16 max-w-2xl">
              Built by outsiders.<br />
              Loved by insiders.<br />
              Feared by dinosaurs.
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: "We reduced churn by 34% in the first 60 days. ExitLoop paid for itself within the first week.",
                  author: "Jason Martinez",
                  role: "Founder, CloudMetrics",
                  image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop"
                },
                {
                  quote: "Our save rate went from 8% to 31%. That's an extra $4,200 MRR we would have lost every month.",
                  author: "Sarah Chen",
                  role: "Head of Growth, DataSync",
                  image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop"
                },
                {
                  quote: "Setup took 20 minutes. Within a week, we had real data on why customers leave. The insights alone are worth it.",
                  author: "Michael Roberts",
                  role: "CTO, InvoiceFlow",
                  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop"
                }
              ].map((t, i) => (
                <div key={i} className="bg-white p-8 border border-black/5 shadow-sm">
                  <div className="w-12 h-12 mb-6 grayscale relative overflow-hidden bg-gray-200">
                    <Image src={t.image} alt={t.author} fill className="object-cover" />
                </div>
                  <p className="text-lg font-medium leading-relaxed mb-6">"{t.quote}"</p>
                  <div>
                    <div className="font-bold">{t.author}</div>
                    <div className="text-sm text-gray-500">{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA SPLIT */}
        <section className="py-0">
          <div className="grid md:grid-cols-2">
          <div className="bg-white px-6 py-24 md:p-24 flex flex-col justify-center">
            <h2 className="font-display font-black text-5xl md:text-6xl uppercase leading-[0.9] tracking-tight mb-8">
              Your "AI Tools"<br />
              Are Guessing.<br />
              ExitLoop Actually<br />
              Knows.
            </h2>
            <p className="text-lg text-gray-600 max-w-md mb-8">
              Stop relying on generic chat bots. Use retention flows trained on thousands of successful saves.
            </p>
            <div className="h-1 w-24 bg-black"></div>
          </div>

            <div className="bg-[#FF4F00] p-12 md:p-24 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('/img/grid.svg')] opacity-20"></div>
               <div className="bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black max-w-sm w-full relative z-10 transform rotate-1">
                 <div className="flex items-start gap-3 mb-4">
                   <div className="w-8 h-8 bg-gray-100 rounded-full flex-shrink-0"></div>
                   <div className="bg-gray-100 p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg text-sm">
                     I want to cancel my subscription.
                      </div>
                  </div>
                 <div className="flex items-start gap-3 justify-end mb-4">
                   <div className="bg-blue-600 text-white p-3 rounded-tl-lg rounded-bl-lg rounded-br-lg text-sm">
                     I understand. Is it because of the price? We can offer you 50% off the next 3 months.
              </div>
                   <div className="w-8 h-8 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">AI</div>
                 </div>
                 <div className="flex gap-2 mt-4">
                    <button className="flex-1 bg-black text-white py-2 text-xs font-bold uppercase">Accept Offer</button>
                    <button className="flex-1 border border-black py-2 text-xs font-bold uppercase">No thanks</button>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="bg-white py-24 md:py-32 border-t border-black">
          <div className="container mx-auto px-6 text-center">
            <h2 className="font-display font-black text-6xl md:text-8xl lg:text-9xl uppercase leading-[0.9] tracking-tight mb-12">
              Stop Managing Software.<br />
              Start Showing Up Human.
            </h2>
            <Button size="lg" className="bg-black hover:bg-gray-800 text-white rounded-none h-16 px-12 text-xl font-bold uppercase tracking-wide" asChild>
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <p className="mt-6 text-gray-500 font-medium">No credit card required • Cancel anytime</p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-100">
        <div className="container mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black flex items-center justify-center text-white font-display font-bold text-xs">E</div>
            <span className="font-display font-bold tracking-tight uppercase">ExitLoop</span>
            </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-gray-600">
            <Link href="#" className="hover:text-black">Terms</Link>
            <Link href="#" className="hover:text-black">Privacy</Link>
            <Link href="#" className="hover:text-black">Twitter</Link>
            <Link href="#" className="hover:text-black">LinkedIn</Link>
            </div>

          <div className="text-sm text-gray-400 font-medium">
            © {new Date().getFullYear()} ExitLoop Inc.
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
