'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  TrendingDown,
  TrendingUp,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Shield,
  Mail,
  RefreshCw,
  ChevronRight,
  MoreHorizontal,
  Settings,
  Plus,
  FileText,
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
  lostMrr: number;
  recoveredMrr: number;
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

// Event config for badges and icons
const EVENT_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'; icon: React.ReactNode }> = {
  payment_failed: { label: 'Payment Failed', variant: 'destructive', icon: <CreditCard className="h-4 w-4" /> },
  payment_retry_sent: { label: 'Retry Sent', variant: 'warning', icon: <Mail className="h-4 w-4" /> },
  payment_recovered: { label: 'Recovered', variant: 'success', icon: <RefreshCw className="h-4 w-4" /> },
  cancellation_attempt: { label: 'Cancel Attempt', variant: 'warning', icon: <TrendingDown className="h-4 w-4" /> },
  offer_accepted: { label: 'Saved', variant: 'success', icon: <Shield className="h-4 w-4" /> },
  offer_declined: { label: 'Churned', variant: 'destructive', icon: <TrendingDown className="h-4 w-4" /> },
  subscription_canceled: { label: 'Cancelled', variant: 'destructive', icon: <Users className="h-4 w-4" /> },
  subscription_updated: { label: 'Updated', variant: 'info', icon: <Activity className="h-4 w-4" /> },
  subscription_recovered: { label: 'Reactivated', variant: 'success', icon: <TrendingUp className="h-4 w-4" /> },
};

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
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Total MRR */}
                  <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Monthly Recurring Revenue
                      </CardTitle>
                      <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(summary.totalMrr)}</div>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                        From {summary.activeSubscriptions} active subscriptions
                      </p>
                    </CardContent>
                  </Card>

                  {/* Active Subscriptions */}
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Active Subscriptions
                      </CardTitle>
                      <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-blue-700 dark:text-blue-300">{summary.activeSubscriptions}</div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        Avg {formatCurrency((summary.totalMrr || 0) / (summary.activeSubscriptions || 1))}/customer
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Stats cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Failed Payments */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Failed Payments
                    </CardTitle>
                    <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summary.failedPayments}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="success" className="text-xs">
                        <ArrowUpRight className="mr-1 h-3 w-3" />
                        {summary.recoveryRate}% recovered
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Cancellation Attempts */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Cancel Attempts
                    </CardTitle>
                    <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                      <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summary.cancellationAttempts}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="success" className="text-xs">
                        <Shield className="mr-1 h-3 w-3" />
                        {summary.saved} saved
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Rate */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Save Rate
                    </CardTitle>
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-600">{summary.saveRate}%</div>
                    <Progress value={summary.saveRate} className="mt-2 h-2" />
                  </CardContent>
                </Card>

                {/* MRR Lost */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      MRR Impact
                    </CardTitle>
                    <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {summary.recoveredMrr - summary.lostMrr >= 0 ? '+' : ''}{formatCurrency(summary.recoveredMrr - summary.lostMrr)}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="success" className="text-xs">
                        +{formatCurrency(summary.recoveredMrr)}
                      </Badge>
                      <Badge variant="destructive" className="text-xs">
                        -{formatCurrency(summary.lostMrr)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts and Activity */}
              <div className="grid gap-6 lg:grid-cols-7">
                {/* Performance Overview */}
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                    <CardDescription>Your churn prevention metrics at a glance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Recovery Rate */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-medium">Payment Recovery Rate</span>
                        </div>
                        <span className="text-2xl font-bold">{summary.recoveryRate}%</span>
                      </div>
                      <Progress value={summary.recoveryRate} className="h-3" />
                      <p className="text-xs text-muted-foreground">
                        {summary.recoveries} of {summary.failedPayments} failed payments successfully recovered
                      </p>
                    </div>

                    <Separator />

                    {/* Save Rate */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Cancellation Save Rate</span>
                        </div>
                        <span className="text-2xl font-bold">{summary.saveRate}%</span>
                      </div>
                      <Progress value={summary.saveRate} className="h-3" />
                      <p className="text-xs text-muted-foreground">
                        {summary.saved} of {summary.cancellationAttempts} cancellation attempts converted to saves
                      </p>
                    </div>

                    <Separator />

                    {/* Net MRR Impact */}
                    <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/30 dark:to-blue-950/30 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Net MRR Impact</p>
                          <p className="text-3xl font-bold text-emerald-600">
                            +{formatCurrency(summary.recoveredMrr - summary.lostMrr)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Recovered vs Lost</p>
                          <p className="text-sm">
                            <span className="text-emerald-600">+{formatCurrency(summary.recoveredMrr)}</span>
                            {' / '}
                            <span className="text-red-600">-{formatCurrency(summary.lostMrr)}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Discount Stats */}
                    {discountData && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium">Discount Acceptance Rate</span>
                            </div>
                            <span className="text-2xl font-bold">{discountData.acceptanceRate}%</span>
                          </div>
                          <Progress value={discountData.acceptanceRate} className="h-3" />
                          <p className="text-xs text-muted-foreground">
                            {discountData.totalOffersAccepted} of {discountData.totalOffersShown} offers accepted
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="lg:col-span-3">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest churn-related events</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">
                      View all
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {events.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground">No events yet</p>
                        <p className="text-xs text-muted-foreground">Events will appear here as they happen</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {events.slice(0, 6).map((event) => {
                          const config = EVENT_CONFIG[event.type] || {
                            label: event.type,
                            variant: 'secondary' as const,
                            icon: <Activity className="h-4 w-4" />,
                          };

                          return (
                            <div key={event.id} className="flex items-start gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="text-xs bg-secondary">
                                  {getInitials(event.customerEmail)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium leading-none">
                                    {event.customerEmail.split('@')[0]}
                                  </p>
                                  <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
                                    {config.label}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {event.details.reason || event.details.amount || 'No details'}
                                  {event.details.mrrImpact && (
                                    <span className={event.details.mrrImpact.startsWith('+') ? 'text-emerald-600 ml-1' : 'text-red-600 ml-1'}>
                                      ({event.details.mrrImpact})
                                    </span>
                                  )}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(event.timestamp)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Active Discounts Card */}
              {discountData && discountData.activeDiscounts > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Percent className="h-5 w-5 text-purple-600" />
                          Active Discounts
                        </CardTitle>
                        <CardDescription>
                          {discountData.activeDiscounts} customers currently have active retention discounts
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {discountData.activeDiscounts}
                      </Badge>
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
                            <div>
                              <Badge variant="success" className="gap-1">
                                <Percent className="h-3 w-3" />
                                {discount.discountPercent}% off
                              </Badge>
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
                        And {discountData.activeDiscounts - 5} more active discounts...
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Events Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>All Events</CardTitle>
                      <CardDescription>Complete history of churn-related events</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No events recorded yet</p>
                      <p className="text-sm text-muted-foreground">
                        Events will be logged when customers interact with your cancel flow or when payment events occur.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <div className="grid grid-cols-[1fr_2fr_1fr_1fr_auto] gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
                        <div>Event</div>
                        <div>Customer</div>
                        <div>Details</div>
                        <div>Time</div>
                        <div></div>
                      </div>
                      <div className="divide-y">
                        {events.map((event) => {
                          const config = EVENT_CONFIG[event.type] || {
                            label: event.type,
                            variant: 'secondary' as const,
                            icon: <Activity className="h-4 w-4" />,
                          };

                          return (
                            <div key={event.id} className="grid grid-cols-[1fr_2fr_1fr_1fr_auto] gap-4 px-4 py-3 items-center hover:bg-muted/50 transition-colors">
                              <div>
                                <Badge variant={config.variant} className="gap-1">
                                  {config.icon}
                                  {config.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(event.customerEmail)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{event.customerEmail}</p>
                                  <p className="text-xs text-muted-foreground">{event.customerId}</p>
                                </div>
                              </div>
                              <div className="text-sm">
                                {event.details.amount && <p>{event.details.amount}</p>}
                                {event.details.reason && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {event.details.reason}
                                  </p>
                                )}
                                {event.details.mrrImpact && (
                                  <p className={`text-xs font-medium ${event.details.mrrImpact.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                                    MRR: {event.details.mrrImpact}
                                  </p>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatRelativeTime(event.timestamp)}
                              </div>
                              <div>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
      </div>
    </AppLayout>
  );
}
