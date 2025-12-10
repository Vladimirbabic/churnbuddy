'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CreditCard,
  Check,
  AlertCircle,
  ExternalLink,
  Calendar,
  Zap,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppLayout } from '@/components/AppLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SubscriptionData {
  hasSubscription: boolean;
  plan: string | null;
  planName: string | null;
  status: string | null;
  cancelFlowsLimit: number;
  cancelFlowsUsed: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  isTrialing: boolean;
  features: string[];
  demoMode?: boolean;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
}

const PLAN_FEATURES: Record<string, string[]> = {
  basic: ['1 Cancel Flow', 'Analytics', 'Email support'],
  growth: ['5 Cancel Flows', 'Email Sequences', 'Analytics', 'Priority support'],
  scale: ['Unlimited Cancel Flows', 'Email Sequences', 'Analytics', 'Priority support', 'API access'],
};

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9,
    description: 'For small teams getting started',
    features: ['1 Cancel Flow', 'Analytics', 'Email support'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 19,
    description: 'For growing businesses',
    features: ['5 Cancel Flows', 'Email Sequences', 'Analytics', 'Priority support'],
    popular: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 49,
    description: 'For high-volume operations',
    features: ['Unlimited Cancel Flows', 'Email Sequences', 'Analytics', 'Priority support', 'API access'],
  },
];

function BillingPageContent() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  useEffect(() => {
    // Check for success/canceled params from Stripe redirect
    if (searchParams.get('success') === 'true') {
      setMessage({ type: 'success', text: 'Subscription activated successfully!' });
    } else if (searchParams.get('canceled') === 'true') {
      setMessage({ type: 'error', text: 'Checkout was canceled' });
    }

    fetchSubscription();
  }, [searchParams]);

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

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access at the end of your billing period.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Subscription will be canceled at the end of your billing period' });
        fetchSubscription();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to cancel subscription' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cancel subscription' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Subscription resumed!' });
        fetchSubscription();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to resume subscription' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to resume subscription' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePortal = async () => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'portal' }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to open billing portal' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to open billing portal' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgrade = async (newPlan: string) => {
    setUpgradingPlan(newPlan);
    try {
      // If no Stripe subscription exists, use checkout to create one
      if (!subscription?.stripeSubscriptionId) {
        const response = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: newPlan,
            successUrl: `${window.location.origin}/billing?success=true`,
            cancelUrl: `${window.location.origin}/billing?canceled=true`,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Redirect to Stripe Checkout
          window.location.href = data.url;
          return;
        } else {
          const data = await response.json();
          setMessage({ type: 'error', text: data.error || 'Failed to start checkout' });
          setUpgradingPlan(null);
          return;
        }
      }

      // Existing Stripe subscription - use upgrade flow
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upgrade', newPlan }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Successfully upgraded to ${newPlan} plan!` });
        setShowUpgradeModal(false);
        fetchSubscription();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to upgrade plan' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upgrade plan' });
    } finally {
      setUpgradingPlan(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <AppLayout title="Billing" description="Manage your subscription and billing">
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading billing...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const usagePercent = subscription?.cancelFlowsLimit && subscription.cancelFlowsLimit > 0
    ? Math.min((subscription.cancelFlowsUsed / subscription.cancelFlowsLimit) * 100, 100)
    : 0;

  return (
    <AppLayout title="Billing" description="Manage your subscription and billing">
      <div className="space-y-6 max-w-4xl">
          {/* Message */}
          {message && (
            <div className={`flex items-center gap-2 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
            }`}>
              {message.type === 'success' ? (
                <Check className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              {message.text}
            </div>
          )}

          {!subscription?.hasSubscription ? (
            // No subscription - show upgrade prompt
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Start Your Free Trial</CardTitle>
                <CardDescription className="text-base">
                  Get 14 days free access to all features. No credit card required to start.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button size="lg" asChild>
                  <Link href="/pricing">
                    View Plans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Current Plan */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Current Plan</CardTitle>
                      <CardDescription>Your subscription details</CardDescription>
                    </div>
                    <Badge
                      variant={
                        subscription.status === 'active' || subscription.status === 'trialing'
                          ? 'success'
                          : subscription.status === 'past_due'
                          ? 'warning'
                          : 'destructive'
                      }
                    >
                      {subscription.isTrialing ? 'Trial' : subscription.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold capitalize">{subscription.planName || subscription.plan}</p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.plan === 'basic' && '$9/month'}
                        {subscription.plan === 'growth' && '$19/month'}
                        {subscription.plan === 'scale' && '$49/month'}
                      </p>
                    </div>
                    {subscription.cancelAtPeriodEnd && (
                      <Badge variant="warning">Cancels at period end</Badge>
                    )}
                  </div>

                  {/* Trial info */}
                  {subscription.isTrialing && subscription.trialEnd && (
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <Calendar className="h-4 w-4" />
                        <p className="text-sm font-medium">
                          Trial ends on {formatDate(subscription.trialEnd)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Usage */}
                  {subscription.cancelFlowsLimit > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Cancel Flows Used</span>
                        <span className="font-medium">
                          {subscription.cancelFlowsUsed} / {subscription.cancelFlowsLimit}
                        </span>
                      </div>
                      <Progress value={usagePercent} className="h-2" />
                    </div>
                  )}

                  {subscription.cancelFlowsLimit === -1 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-emerald-600" />
                      Unlimited Cancel Flows
                    </div>
                  )}

                  {/* Billing period */}
                  {subscription.currentPeriodEnd && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {subscription.cancelAtPeriodEnd
                        ? `Access until ${formatDate(subscription.currentPeriodEnd)}`
                        : `Next billing date: ${formatDate(subscription.currentPeriodEnd)}`
                      }
                    </div>
                  )}

                  {/* Features */}
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-3">Included Features</p>
                    <ul className="space-y-2">
                      {(subscription.features.length > 0
                        ? subscription.features
                        : PLAN_FEATURES[subscription.plan || ''] || []
                      ).map((feature: string) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-emerald-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-3 border-t pt-6">
                  <Button variant="outline" onClick={handlePortal} disabled={actionLoading}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Manage Billing
                  </Button>
                  {subscription.plan !== 'scale' && (
                    <Button onClick={() => setShowUpgradeModal(true)}>
                      Upgrade Plan
                    </Button>
                  )}
                  {subscription.cancelAtPeriodEnd ? (
                    <Button variant="outline" onClick={handleResume} disabled={actionLoading}>
                      Resume Subscription
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={handleCancel}
                      disabled={actionLoading}
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </CardFooter>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Manage your payment details</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={handlePortal} disabled={actionLoading}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Update Payment Method
                  </Button>
                </CardContent>
              </Card>

              {/* Invoices */}
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>View and download your invoices</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={handlePortal} disabled={actionLoading}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Invoices
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Upgrade Plan Modal */}
          <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Choose Your Plan</DialogTitle>
                <DialogDescription>
                  Select the plan that best fits your needs. You can upgrade or downgrade anytime.
                </DialogDescription>
              </DialogHeader>
              <div className="grid md:grid-cols-3 gap-4 py-4">
                {PLANS.map((plan) => {
                  const isCurrentPlan = subscription?.plan === plan.id;
                  const isUpgrade = subscription?.plan &&
                    PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === subscription.plan);
                  const isDowngrade = subscription?.plan &&
                    PLANS.findIndex(p => p.id === plan.id) < PLANS.findIndex(p => p.id === subscription.plan);

                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-xl border p-5 transition-all ${
                        isCurrentPlan
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50 hover:shadow-md'
                      } ${plan.popular ? 'ring-2 ring-primary' : ''}`}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary">
                          Popular
                        </Badge>
                      )}
                      {isCurrentPlan && (
                        <Badge variant="secondary" className="absolute -top-2.5 right-3">
                          Current
                        </Badge>
                      )}
                      <div className="text-center mb-4">
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                        <div className="mt-3">
                          <span className="text-3xl font-bold">${plan.price}</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                      </div>
                      <ul className="space-y-2 mb-4">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={isCurrentPlan ? 'secondary' : isUpgrade ? 'default' : 'outline'}
                        disabled={isCurrentPlan || upgradingPlan === plan.id}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {upgradingPlan === plan.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : isCurrentPlan ? (
                          'Current Plan'
                        ) : isUpgrade ? (
                          'Upgrade'
                        ) : isDowngrade ? (
                          'Downgrade'
                        ) : (
                          'Select'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
      </div>
    </AppLayout>
  );
}

// Loading fallback for Suspense
function BillingLoading() {
  return (
    <AppLayout title="Billing" description="Manage your subscription and billing">
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading billing...</p>
        </div>
      </div>
    </AppLayout>
  );
}

// Wrapper with Suspense boundary for useSearchParams
export default function BillingPage() {
  return (
    <Suspense fallback={<BillingLoading />}>
      <BillingPageContent />
    </Suspense>
  );
}
