'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  ArrowRight,
  Check,
  Zap,
  Menu,
  X,
  Play,
  BarChart3,
  Mail,
  MessageSquare,
  Users,
  Code,
  Layers,
  CreditCard,
  TrendingUp,
  PieChart,
  RefreshCcw,
  Rocket,
  HeartHandshake,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CancelFlowModal } from '@/components/CancelFlowModal';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const { user } = useAuth();

  // Demo modal state handler
  const handleDemoClick = () => {
    setShowDemoModal(true);
  };

  const features = [
    {
      title: "Cancel Flow Interceptor",
      description: "Trigger a friendly, branded modal the exact moment someone clicks Cancel. Offer better options, not a dead end.",
      icon: Shield
    },
    {
      title: "Smart Recovery Nudges",
      description: "When payments fail, ExitLoop sends polite, automated messages and retries to recover revenue without awkward emails.",
      icon: RefreshCcw
    },
    {
      title: "Churn Reasons and Insights",
      description: "See why people leave in plain language. Track top churn reasons over time and find easy wins.",
      icon: PieChart
    },
    {
      title: "Win back recently churned users",
      description: "Set up one time or ongoing win back campaigns. Send offers to users who churned in the last 7, 30, or 90 days.",
      icon: HeartHandshake
    },
    {
      title: "Startup friendly setup",
      description: "No engineering marathon. Start with templates, customize copy, and ship your first save flow in minutes.",
      icon: Rocket
    },
    {
      title: "Built for SaaS stacks",
      description: "Connect your billing and analytics tools so ExitLoop fits right into the stack you already use.",
      icon: Layers
    }
  ];

  const faqs = [
    {
      question: "How long does it take to get ExitLoop live?",
      answer: "Most teams get a basic cancel flow live in under an afternoon. If you can copy paste a snippet, you can ship ExitLoop."
    },
    {
      question: "Do I need engineers to maintain this?",
      answer: "You might need a dev once to connect billing or events, after that, product or growth can manage flows and copy without code."
    },
    {
      question: "Will this annoy my users?",
      answer: "ExitLoop is designed to be friendly and honest, not dark pattern. You can keep the cancel option visible while still offering better alternatives."
    },
    {
      question: "Does ExitLoop work with my current stack?",
      answer: "We integrate with popular billing and analytics tools and can start simple even if your stack is messy. Start small, improve over time."
    },
    {
      question: "What if I am pre product market fit?",
      answer: "ExitLoop still helps you understand cancel reasons and keep early users longer, which can be critical for finding product market fit faster."
    }
  ];

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* 1) Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            ExitLoop
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#product" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Product</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">How it works</Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
            <Link href="#resources" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Resources</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Log in
                </Link>
                <Button asChild>
                  <Link href="/signup">Start free</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t p-4 bg-background absolute w-full">
            <div className="flex flex-col space-y-4">
              <Link href="#product" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Product</Link>
              <Link href="#how-it-works" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>How it works</Link>
              <Link href="#pricing" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
              <Link href="#resources" className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Resources</Link>
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
        {/* 2) Hero Section */}
        <section className="container py-24 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6 text-left">
              <Badge variant="secondary" className="w-fit">
                Retention for SaaS startups
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Do not let users fall into the <span className="text-primary">exit loop</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                ExitLoop intercepts cancellations in real time and guides customers toward smarter options like downgrading, pausing, or staying. Save more customers, keep more MRR, without enterprise pricing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Button size="lg" asChild>
                  <Link href="/signup">Start saving customers</Link>
                </Button>
                <Button size="lg" variant="ghost" className="gap-2" onClick={handleDemoClick}>
                  <Play className="h-4 w-4" />
                  Watch a 90 second demo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                No code to start, cancel any time
              </p>
            </div>

            {/* Visual Mockup */}
            <div className="relative mx-auto w-full max-w-[500px] aspect-square lg:aspect-auto lg:h-[500px] bg-muted rounded-xl border p-4 flex items-center justify-center overflow-hidden">
              {/* Background Dashboard Mock */}
              <div className="absolute inset-0 bg-background/50 p-6 opacity-50 pointer-events-none">
                 <div className="h-8 w-32 bg-muted-foreground/20 rounded mb-8"></div>
                 <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="h-24 bg-muted-foreground/20 rounded"></div>
                    <div className="h-24 bg-muted-foreground/20 rounded"></div>
                    <div className="h-24 bg-muted-foreground/20 rounded"></div>
                 </div>
                 <div className="space-y-4">
                    <div className="h-4 w-full bg-muted-foreground/20 rounded"></div>
                    <div className="h-4 w-5/6 bg-muted-foreground/20 rounded"></div>
                    <div className="h-4 w-4/6 bg-muted-foreground/20 rounded"></div>
                 </div>
              </div>
              
              {/* Modal Mock */}
              <div className="relative z-10 w-full max-w-sm bg-background border rounded-lg shadow-2xl p-6 space-y-6">
                <div className="space-y-2 text-center">
                    <h3 className="text-lg font-semibold">Wait, before you go...</h3>
                    <p className="text-sm text-muted-foreground">We'd hate to see you leave. Would you consider pausing your subscription instead?</p>
                </div>
                <div className="space-y-3">
                    <div className="p-3 border rounded-md hover:bg-muted cursor-pointer transition-colors flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <Zap className="h-4 w-4" />
                        </div>
                        <div className="text-sm">
                            <p className="font-medium">Pause for 3 months</p>
                            <p className="text-xs text-muted-foreground">Return when you're ready</p>
                        </div>
                    </div>
                     <div className="p-3 border rounded-md hover:bg-muted cursor-pointer transition-colors flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                            <CreditCard className="h-4 w-4" />
                        </div>
                        <div className="text-sm">
                            <p className="font-medium">Get 50% off for 3 months</p>
                            <p className="text-xs text-muted-foreground">Apply discount immediately</p>
                        </div>
                    </div>
                </div>
                <div className="pt-2 flex gap-3">
                    <Button variant="outline" className="w-full text-xs">I still want to cancel</Button>
                    <Button className="w-full text-xs">Keep my subscription</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3) Social Proof Strip */}
        <section className="border-y bg-muted/30 py-12">
          <div className="container text-center">
            <p className="text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wider">Trusted by scrappy SaaS teams</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale opacity-70">
              {/* Placeholders for logos */}
              <div className="flex items-center gap-2 font-bold text-xl"><div className="h-8 w-8 bg-foreground/20 rounded-full"></div> Launchboard</div>
              <div className="flex items-center gap-2 font-bold text-xl"><div className="h-8 w-8 bg-foreground/20 rounded-full"></div> MetricFox</div>
              <div className="flex items-center gap-2 font-bold text-xl"><div className="h-8 w-8 bg-foreground/20 rounded-full"></div> Shipbright</div>
              <div className="flex items-center gap-2 font-bold text-xl"><div className="h-8 w-8 bg-foreground/20 rounded-full"></div> Taskline</div>
            </div>
          </div>
        </section>

        {/* 4) The Problem Section */}
        <section className="container py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Churn is not random, it happens in one moment
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* The Old Way */}
            <Card className="bg-red-50/50 border-red-100 dark:bg-red-950/10 dark:border-red-900/50">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">The old way</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                        <X className="h-5 w-5 text-red-500 mt-0.5" />
                        <span>Users click Cancel and disappear</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <X className="h-5 w-5 text-red-500 mt-0.5" />
                        <span>You get no useful feedback</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <X className="h-5 w-5 text-red-500 mt-0.5" />
                        <span>Failed payments quietly stack up</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <X className="h-5 w-5 text-red-500 mt-0.5" />
                        <span>You only see the damage in your churn report</span>
                    </li>
                </ul>
                <div className="pt-4 border-t border-red-200 dark:border-red-900/50 mt-4">
                    <p className="font-medium italic text-red-700 dark:text-red-300">You are losing customers at the exact moment you could have a conversation.</p>
                </div>
              </CardContent>
            </Card>

            {/* The ExitLoop Way */}
            <Card className="bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-emerald-600 dark:text-emerald-400">The ExitLoop way</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <span>ExitLoop intercepts the cancel click</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <span>Shows a friendly modal, not a hard wall</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <span>Offers pause, downgrade, discount, or help</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <span>Captures churn reasons automatically</span>
                    </li>
                </ul>
                <div className="pt-4 border-t border-emerald-200 dark:border-emerald-900/50 mt-4">
                    <p className="font-medium italic text-emerald-700 dark:text-emerald-300">Turn cancellations into conversations and conversations into saved revenue.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 5) How ExitLoop Works */}
        <section id="how-it-works" className="bg-muted/50 py-24">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How ExitLoop catches churn in three simple steps
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background p-8 rounded-xl border shadow-sm relative">
                <div className="absolute -top-4 left-8 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
                <h3 className="text-xl font-bold mb-3 mt-2">Drop in ExitLoop</h3>
                <p className="text-muted-foreground">Install a tiny snippet in your app or connect via your billing provider. Choose where and when the cancel flow should appear.</p>
              </div>

              <div className="bg-background p-8 rounded-xl border shadow-sm relative">
                 <div className="absolute -top-4 left-8 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
                <h3 className="text-xl font-bold mb-3 mt-2">Design your save paths</h3>
                <p className="text-muted-foreground">Use our visual editor to set up options like pause, downgrade, discount, or talk to support, plus quick feedback questions.</p>
              </div>

              <div className="bg-background p-8 rounded-xl border shadow-sm relative">
                 <div className="absolute -top-4 left-8 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
                <h3 className="text-xl font-bold mb-3 mt-2">Let ExitLoop intercept churn</h3>
                <p className="text-muted-foreground">Whenever a user hits Cancel, ExitLoop shows up with a better path. You watch churn go down and MRR stabilize.</p>
              </div>
            </div>

            <div className="text-center mt-12">
                <Button size="lg" asChild>
                    <Link href="/demo">See ExitLoop in action</Link>
                </Button>
            </div>
          </div>
        </section>

        {/* 6) Feature Grid */}
        <section id="product" className="container py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to stop the exit loop
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-none bg-muted/20 hover:bg-muted/40 transition-colors">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 7) Results and Use Cases */}
        <section className="py-24 bg-muted/30">
          <div className="container">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  What ExitLoop does for your metrics
               </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Drop voluntary churn
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">Use downgrade and pause options to keep customers who are not ready to leave forever.</p>
                        <p className="text-sm font-medium text-primary">Keep more of the users who already like you.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Protect MRR from failed payments
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">Recover revenue that would otherwise disappear due to expired cards and payment hiccups.</p>
                        <p className="text-sm font-medium text-primary">Found money, on autopilot.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Learn faster from churn
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">Stop guessing why people leave. Let ExitLoop collect and organize real answers from cancelling users.</p>
                        <p className="text-sm font-medium text-primary">Direct input for your roadmap, from the customers who matter most.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Testimonial */}
            <div className="mt-16 max-w-3xl mx-auto text-center">
                <blockquote className="text-xl italic font-medium leading-relaxed">
                    "We plugged in ExitLoop and within weeks we were saving accounts that would never have talked to us. It paid for itself almost immediately."
                </blockquote>
                <div className="mt-4">
                    <div className="font-semibold">Name, Title</div>
                    <div className="text-sm text-muted-foreground">Company</div>
                </div>
            </div>
          </div>
        </section>

        {/* 8) Pricing Teaser */}
        <section id="pricing" className="container py-24">
           <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                 Pricing that does not put you in your own exit loop
              </h2>
              <p className="text-xl text-muted-foreground">
                ExitLoop is built for SaaS founders and small teams. Simple, transparent pricing, no long term contracts, no per seat tricks.
              </p>
           </div>

           <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Starter Plan */}
              <Card className="relative">
                  <CardHeader>
                      <CardTitle className="text-2xl">Starter</CardTitle>
                      <CardDescription>Perfect for early stage</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <ul className="space-y-3 text-sm">
                          <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Up to [X] monthly active users</li>
                          <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Cancel flows</li>
                          <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Basic insights</li>
                          <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Email support</li>
                      </ul>
                      <Button className="w-full" variant="outline" asChild>
                          <Link href="/waitlist">Join the waitlist</Link>
                      </Button>
                  </CardContent>
              </Card>

              {/* Growth Plan */}
              <Card className="relative border-primary shadow-lg">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">Most Popular</div>
                  <CardHeader>
                      <CardTitle className="text-2xl">Growth</CardTitle>
                      <CardDescription>For scaling SaaS teams</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <ul className="space-y-3 text-sm">
                          <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Everything in Starter</li>
                          <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Advanced targeting</li>
                          <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Win back campaigns</li>
                          <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Priority support</li>
                      </ul>
                      <Button className="w-full" asChild>
                          <Link href="/contact">Talk to us</Link>
                      </Button>
                  </CardContent>
              </Card>
           </div>
           <div className="text-center mt-8 text-muted-foreground text-sm">
              Not sure where you fit? Reach out and we will match the plan to your stage.
           </div>
        </section>

        {/* 9) FAQ */}
        <section id="resources" className="bg-muted/30 py-24">
           <div className="container max-w-3xl">
              <div className="text-center mb-16">
                 <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Questions about leaving the exit loop
                 </h2>
              </div>
              <div className="space-y-6">
                 {faqs.map((faq, i) => (
                    <div key={i} className="bg-background rounded-lg p-6 shadow-sm border">
                        <h3 className="font-bold text-lg mb-2">{faq.question}</h3>
                        <p className="text-muted-foreground">{faq.answer}</p>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* 10) Final CTA */}
        <section className="container py-24 text-center">
            <div className="max-w-3xl mx-auto space-y-8">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                    Ready to catch your next churn before it happens?
                </h2>
                <p className="text-xl text-muted-foreground">
                    Ship your first cancel save flow, watch the first saved customer stay, and never look at your cancel button the same way again.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button size="lg" className="h-12 px-8 text-lg" asChild>
                        <Link href="/signup">Get started on ExitLoop</Link>
                    </Button>
                    <Link href="/demo" className="text-muted-foreground hover:text-foreground font-medium hover:underline underline-offset-4">
                        Or book a quick walkthrough
                    </Link>
                </div>
            </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
              <Shield className="h-3 w-3" />
            </div>
            ExitLoop
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ExitLoop. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Re-using the existing component for demo/visual purposes if triggered */}
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
