'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  TrendingDown,
  Users,
  DollarSign,
  ArrowUpRight,
  Activity,
  Shield,
  RefreshCw,
  Settings,
  Plus,
  Percent,
  Tag,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/AppLayout';

// Types
interface DashboardSummary {
  failedPayments: number;
  cancellations: number;
  recoveries: number;
  saved: number;
  cancellationAttempts: number;
  customersAtRisk?: number;
  lostMrr: number;
  recoveredMrr: number;
  savedMrr?: number; // MRR saved by ChurnBuddy
  saveRate: number;
  recoveryRate: number;
  totalMrr?: number;
  activeSubscriptions?: number;
}

interface DashboardEvent {
  id: string;
  type: string;
  timestamp: string;
  customerId: string;
  customerEmail: string;
  details: {
    amount: string | null;
    reason: string | null;
    mrrImpact: string | null;
  };
}

// Empty state data
const EMPTY_SUMMARY: DashboardSummary = {
  failedPayments: 0,
  cancellations: 0,
  recoveries: 0,
  saved: 0,
  cancellationAttempts: 0,
  lostMrr: 0,
  recoveredMrr: 0,
  saveRate: 0,
  recoveryRate: 0,
};

// Discount analytics types
interface DiscountAnalytics {
  activeDiscounts: number;
  activeDiscountsList: Array<{
    customerId: string;
    customerEmail: string | null;
    subscriptionId: string;
    discountPercent: number | null;
    couponName: string | null;
    endsAt: string | null;
  }>;
  totalOffersShown: number;
  totalOffersAccepted: number;
  acceptanceRate: number;
  recentDiscounts: Array<{
    customerId: string;
    customerEmail: string | null;
    discountPercent: number;
    appliedAt: string;
    reason: string | null;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<{ summary: DashboardSummary; events: DashboardEvent[]; stripeConnected?: boolean } | null>(null);
  const [discountData, setDiscountData] = useState<DiscountAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    // Fetch real data from API
    const fetchData = async () => {
      try {
        const [dashboardResponse, discountResponse] = await Promise.all([
          fetch(`/api/dashboard?period=${period}`),
          fetch('/api/analytics/discounts'),
        ]);

        if (dashboardResponse.ok) {
          const result = await dashboardResponse.json();
          setData(result);
        } else {
          setData({ summary: EMPTY_SUMMARY, events: [] });
        }

        if (discountResponse.ok) {
          const discountResult = await discountResponse.json();
          setDiscountData(discountResult);
        }
      } catch (error) {
        // If API fails, show empty state
        setData({ summary: EMPTY_SUMMARY, events: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <AppLayout title="Dashboard" description="Track and reduce customer churn">
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { summary, events, stripeConnected } = data!;
  const hasData = events.length > 0 || summary.failedPayments > 0 || summary.cancellationAttempts > 0 || (summary.activeSubscriptions && summary.activeSubscriptions > 0);

  return (
    <AppLayout
      title="Dashboard"
    >
      <div className="space-y-6">
          {!hasData ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                <Activity className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">No activity yet</h2>
                <p className="text-muted-foreground max-w-md">
                  Connect your Stripe account and add the cancel flow to your app to start tracking churn events.
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/onboarding">
                    <Plus className="mr-2 h-4 w-4" />
                    Complete Setup
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Stripe connection banner */}
              {!stripeConnected && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Connect Stripe to see real data</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Add your Stripe API keys in Settings to fetch live subscription and payment data.</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/settings">Connect Stripe</Link>
                  </Button>
                </div>
              )}

              {/* MRR Overview cards - only show when Stripe is connected */}
              {stripeConnected && summary.totalMrr !== undefined && (
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Monthly Recurring Revenue
                      </CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{formatCurrency(summary.totalMrr)}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {summary.activeSubscriptions} active subscriptions
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Revenue Saved
                      </CardTitle>
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{formatCurrency(summary.savedMrr || 0)}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {summary.saved > 0 ? `${summary.saved} saved customers` : 'Protected by ChurnBuddy'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active Subscriptions
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{summary.activeSubscriptions}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Avg {formatCurrency((summary.totalMrr || 0) / (summary.activeSubscriptions || 1))}/customer
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Performance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Payment Recovery Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Payment Recovery Rate</span>
                      <span className="text-2xl font-bold">{summary.recoveryRate}%</span>
                    </div>
                    <Progress value={summary.recoveryRate} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {summary.recoveries} of {summary.failedPayments} failed payments recovered
                    </p>
                  </div>

                  <Separator />

                  {/* Cancellation Save Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Cancellation Save Rate</span>
                      <span className="text-2xl font-bold">{summary.saveRate}%</span>
                    </div>
                    <Progress value={summary.saveRate} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {summary.saved} of {summary.cancellationAttempts} cancellation attempts saved
                    </p>
                  </div>

                  <Separator />

                  {/* Discount Acceptance Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Discount Acceptance Rate</span>
                      <span className="text-2xl font-bold">{discountData?.acceptanceRate || 0}%</span>
                    </div>
                    <Progress value={discountData?.acceptanceRate || 0} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {discountData?.totalOffersAccepted || 0} of {discountData?.totalOffersShown || 0} discount offers accepted
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Active Discounts Card */}
              {discountData && discountData.activeDiscounts > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Active Discounts</CardTitle>
                        <CardDescription>
                          {discountData.activeDiscounts} customers with retention discounts
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
                        <div>Customer</div>
                        <div>Discount</div>
                        <div>Coupon</div>
                        <div>Expires</div>
                      </div>
                      <div className="divide-y">
                        {discountData.activeDiscountsList.slice(0, 5).map((discount) => (
                          <div key={discount.subscriptionId} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-4 py-3 items-center hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {discount.customerEmail ? getInitials(discount.customerEmail) : '??'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {discount.customerEmail || 'Unknown'}
                                </p>
                                <p className="text-xs text-muted-foreground">{discount.customerId}</p>
                              </div>
                            </div>
                            <div className="text-sm font-medium">
                              {discount.discountPercent}% off
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {discount.couponName || 'Retention Offer'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {discount.endsAt
                                ? new Date(discount.endsAt).toLocaleDateString()
                                : 'Forever'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {discountData.activeDiscounts > 5 && (
                      <p className="text-xs text-muted-foreground mt-3 text-center">
                        +{discountData.activeDiscounts - 5} more
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

            </>
          )}
      </div>
    </AppLayout>
  );
}
