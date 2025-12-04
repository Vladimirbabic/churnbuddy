'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Shield,
  Check,
  ArrowRight,
  Zap,
  Users,
  Building2,
  Loader2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface SubscriptionData {
  hasSubscription: boolean;
  plan: string | null;
  status: string | null;
  isTrialing: boolean;
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small SaaS products just getting started',
    price: 9,
    interval: 'month',
    icon: Zap,
    tier: 1,
    features: [
      '1 Cancel Flow',
      'Exit survey collection',
      'Email support',
      'Basic analytics',
    ],
    limitations: [
      'Single product/app',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'For growing businesses with multiple products',
    price: 19,
    interval: 'month',
    icon: Users,
    tier: 2,
    features: [
      '5 Cancel Flows',
      'Custom exit surveys',
      'Priority email support',
      'Advanced analytics',
      'Custom branding',
      'Slack notifications',
    ],
    limitations: [],
    popular: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    description: 'For businesses that need unlimited flexibility',
    price: 49,
    interval: 'month',
    icon: Building2,
    tier: 3,
    features: [
      'Unlimited Cancel Flows',
      'Custom exit surveys',
      'Priority support + Slack',
      'Advanced analytics',
      'Custom branding',
      'Slack notifications',
      'API access',
      'Custom integrations',
      'Dedicated success manager',
    ],
    limitations: [],
  },
];

export default function PricingPage() {
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const canceled = searchParams.get('canceled') === 'true';

  useEffect(() => {
    checkAuth();
    fetchSubscription();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
  };

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/billing/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlanTier = () => {
    if (!subscription?.plan) return 0;
    const plan = plans.find(p => p.id === subscription.plan);
    return plan?.tier || 0;
  };

  const getButtonConfig = (planId: string, planTier: number) => {
    const currentTier = getCurrentPlanTier();

    if (!subscription?.hasSubscription || subscription.status === 'canceled') {
      return { label: 'Start Free Trial', action: 'checkout', icon: ArrowRight };
    }

    if (subscription.plan === planId) {
      return { label: 'Current Plan', action: 'none', icon: Check };
    }

    if (planTier > currentTier) {
      return { label: 'Upgrade', action: 'upgrade', icon: ArrowUp };
    }

    return { label: 'Downgrade', action: 'downgrade', icon: ArrowDown };
  };

  const handleSelectPlan = async (planId: string, action: string) => {
    if (action === 'none') return;

    setLoadingPlan(planId);
    setError(null);
    setSuccess(null);

    try {
      if (action === 'checkout') {
        // New subscription - go to checkout
        const response = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: planId }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.demoMode) {
            setError('Stripe is not configured. Add STRIPE_SECRET_KEY to enable billing.');
          } else {
            setError(data.error || 'Failed to create checkout session');
          }
          return;
        }

        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        // Upgrade or downgrade existing subscription
        const response = await fetch('/api/billing/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'upgrade', newPlan: planId }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to change plan');
          return;
        }

        setSuccess(data.message || `Successfully changed to ${planId} plan!`);
        fetchSubscription(); // Refresh subscription data
      }
    } catch (err) {
      setError('Failed to process request. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Exit Loop</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How it works
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-foreground transition-colors">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button size="sm" className="gap-2" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Pricing Header */}
      <section className="container py-16 md:py-24 text-center">
        {canceled && (
          <div className="mb-6 mx-auto max-w-md flex items-center gap-2 p-4 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            Checkout was canceled. Choose a plan when you're ready!
          </div>
        )}

        {error && (
          <div className="mb-6 mx-auto max-w-md flex items-center gap-2 p-4 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 mx-auto max-w-md flex items-center gap-2 p-4 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
            <Check className="h-5 w-5 shrink-0" />
            {success}
          </div>
        )}

        {/* Show current plan banner */}
        {subscription?.hasSubscription && subscription.plan && (
          <div className="mb-8 mx-auto max-w-md">
            <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-primary/10 text-primary">
              <Check className="h-5 w-5" />
              <span className="font-medium">
                You're on the <span className="capitalize">{subscription.plan}</span> plan
                {subscription.isTrialing && ' (Trial)'}
              </span>
            </div>
          </div>
        )}

        <Badge variant="secondary" className="mb-4">
          Simple, transparent pricing
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          {subscription?.hasSubscription ? 'Manage Your Plan' : 'Choose Your Plan'}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {subscription?.hasSubscription
            ? 'Upgrade or downgrade at any time. Changes take effect immediately.'
            : 'Start reducing churn today. All plans include a 14-day free trial.'}
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container pb-24">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isLoading = loadingPlan === plan.id;
            const isCurrentPlan = subscription?.plan === plan.id;
            const buttonConfig = getButtonConfig(plan.id, plan.tier);
            const ButtonIcon = buttonConfig.icon;

            return (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  isCurrentPlan
                    ? 'border-primary shadow-lg ring-2 ring-primary'
                    : plan.popular
                    ? 'border-primary shadow-lg scale-105'
                    : 'border-border'
                }`}
              >
                {isCurrentPlan ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Current Plan
                    </Badge>
                  </div>
                ) : plan.popular && !subscription?.hasSubscription ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                ) : null}
                <CardHeader className="text-center pb-2">
                  <div className={`mx-auto mb-4 h-12 w-12 rounded-lg flex items-center justify-center ${
                    isCurrentPlan ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                  }`}>
                    <Icon className={`h-6 w-6 ${isCurrentPlan ? '' : 'text-primary'}`} />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="min-h-[40px]">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{plan.interval}</span>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation) => (
                      <li key={limitation} className="flex items-start gap-2 text-muted-foreground">
                        <span className="h-5 w-5 shrink-0 mt-0.5 text-center">-</span>
                        <span className="text-sm">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full gap-2"
                    variant={
                      isCurrentPlan
                        ? 'secondary'
                        : buttonConfig.action === 'downgrade'
                        ? 'outline'
                        : 'default'
                    }
                    onClick={() => handleSelectPlan(plan.id, buttonConfig.action)}
                    disabled={!!loadingPlan || buttonConfig.action === 'none'}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {buttonConfig.label}
                        {buttonConfig.action !== 'none' && <ButtonIcon className="h-4 w-4" />}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/50 py-24">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What counts as a cancel flow?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A cancel flow is a unique configuration for intercepting cancellation attempts.
                  Each product or subscription tier you want to protect with custom messaging and
                  offers counts as one cancel flow.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I upgrade or downgrade at any time?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can change your plan at any time. When upgrading, you'll be charged the
                  prorated difference. When downgrading, your new rate will apply at the next billing cycle.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! All plans come with a 14-day free trial. You'll have full access to all
                  features in your chosen plan during the trial.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards through Stripe. You can also pay via ACH bank
                  transfer on annual plans.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!subscription?.hasSubscription && (
        <section className="container py-24 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to reduce churn?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of SaaS founders who are recovering revenue with Exit Loop.
          </p>
          <Button size="lg" className="gap-2" onClick={() => handleSelectPlan('growth', 'checkout')}>
            Start Your Free Trial
            <ArrowRight className="h-4 w-4" />
          </Button>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Shield className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">Exit Loop</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for SaaS founders who care about retention.
          </p>
        </div>
      </footer>
    </div>
  );
}
