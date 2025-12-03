'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  CreditCard,
  Target,
  BarChart3,
  ArrowRight,
  Check,
  Zap,
  Users,
  TrendingUp,
  Mail,
  Code,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CancelFlowModal } from '@/components/CancelFlowModal';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">ChurnBuddy</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#integration" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Integration
            </a>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
            ) : user ? (
              <Button size="sm" asChild>
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/login">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8">
          <Badge variant="secondary" className="px-4 py-1">
            <Zap className="mr-1 h-3 w-3" />
            Reduce churn by up to 40%
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl">
            Stop Losing Customers to{' '}
            <span className="text-primary">Preventable Churn</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl">
            ChurnBuddy helps SaaS founders reduce churn with automated dunning emails
            and intelligent cancel-save flows. Recover failed payments and save customers
            before they leave.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/onboarding">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" onClick={() => setShowModal(true)}>
              Try Cancel Flow Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-8 border-t mt-8 w-full max-w-2xl">
            <div className="text-center">
              <p className="text-3xl font-bold">75%</p>
              <p className="text-sm text-muted-foreground">Payment Recovery</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">60%</p>
              <p className="text-sm text-muted-foreground">Cancellation Saves</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">$1.2M+</p>
              <p className="text-sm text-muted-foreground">MRR Recovered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to fight churn
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete toolkit for reducing involuntary and voluntary churn
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -translate-y-16 translate-x-16" />
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Dunning Management</CardTitle>
              <CardDescription>
                Automatically email customers when payments fail with secure retry links
                and billing portal access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  Smart retry sequences
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  Customizable email templates
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  Stripe billing portal links
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-16 translate-x-16" />
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle>Cancel/Save Flows</CardTitle>
              <CardDescription>
                Intercept cancellations with exit surveys and discount offers to retain
                customers who are about to leave.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  Exit survey collection
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  Dynamic discount offers
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  One-line integration
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16" />
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Track failed payments, cancellations, recoveries, and saved MRR with
                detailed event logs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  Real-time metrics
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  Event activity feed
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  MRR impact tracking
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="bg-muted/50 py-24">
        <div className="container space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get up and running in minutes with our simple integration
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold">Connect Stripe</h3>
              <p className="text-muted-foreground">
                Add your Stripe webhook endpoint and we'll start receiving payment events automatically.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold">Add Cancel Flow</h3>
              <p className="text-muted-foreground">
                Drop our React component into your settings page to intercept cancellation attempts.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold">Watch MRR Grow</h3>
              <p className="text-muted-foreground">
                Monitor your dashboard as ChurnBuddy recovers failed payments and saves customers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section id="integration" className="container py-24 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Quick Integration
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Add ChurnBuddy to your app with just a few lines of code
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                <CardTitle className="text-lg">Cancel Flow Modal</CardTitle>
              </div>
              <CardDescription>
                Add the cancel flow modal to your settings page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
                <code className="text-emerald-600">{`import { CancelFlowModal } from '@churnbuddy/react';

<CancelFlowModal
  isOpen={showCancel}
  onClose={() => setShowCancel(false)}
  customerId="cus_xxx"
  subscriptionId="sub_xxx"
  onCancelConfirmed={handleCancel}
  onOfferAccepted={handleSave}
/>`}</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle className="text-lg">Stripe Webhooks</CardTitle>
              </div>
              <CardDescription>
                Point your Stripe webhook to our endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
                <code className="text-blue-600">{`// Webhook URL
https://your-app.com/api/webhooks/stripe

// Required events
invoice.payment_failed
customer.subscription.deleted
customer.subscription.updated`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard">
              View Live Dashboard Demo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-24">
        <div className="container text-center space-y-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to reduce churn?
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Join hundreds of SaaS founders who are recovering revenue and retaining customers with ChurnBuddy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="gap-2" asChild>
              <Link href="/onboarding">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Shield className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">ChurnBuddy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for SaaS founders who care about retention.
          </p>
        </div>
      </footer>

      {/* Cancel Flow Modal Demo */}
      <CancelFlowModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        customerId="cus_demo123"
        subscriptionId="sub_demo456"
        companyName="ChurnBuddy"
        discountPercent={50}
        discountDuration="3 months"
        onCancelConfirmed={async (reason) => {
          console.log('Demo: Cancelled with reason:', reason);
          setShowModal(false);
        }}
        onOfferAccepted={async () => {
          console.log('Demo: Offer accepted');
          setShowModal(false);
        }}
        onPlanSwitched={async (planId) => {
          console.log('Demo: Switched to plan:', planId);
          setShowModal(false);
        }}
      />
    </div>
  );
}
