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
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppLayout } from '@/components/AppLayout';

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
}

const PLAN_FEATURES: Record<string, string[]> = {
  starter: ['1 Cancel Flow', 'Basic analytics', 'Email support'],
  growth: ['5 Cancel Flows', 'Advanced analytics', 'Priority support', 'Custom branding', 'Slack notifications'],
  scale: ['Unlimited Cancel Flows', 'Advanced analytics', 'Priority support', 'Custom branding', 'API access', 'Dedicated success manager'],
};

function BillingPageContent() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
                        {subscription.plan === 'starter' && '$9/month'}
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
                    <Button asChild>
                      <Link href="/pricing">Upgrade Plan</Link>
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
