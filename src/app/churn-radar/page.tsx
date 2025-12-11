'use client';

import React, { useEffect, useState } from 'react';
import {
  Radar,
  AlertTriangle,
  Eye,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Users,
  Activity,
  Calendar,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AppLayout } from '@/components/AppLayout';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { getRiskBucketColor, getRiskBucketLabel, getSuggestedActions, RiskBucket } from '@/lib/riskScoring';

interface CustomerRisk {
  customer_id: string;
  customer_email: string | null;
  customer_name: string | null;
  plan: string | null;
  plan_id: string | null;
  mrr: number | null;
  risk_score: number;
  risk_bucket: RiskBucket;
  snapshot_date: string;
  // Churn metrics (stored in repurposed columns)
  cancel_attempts_7d: number;      // logins_last_7d
  cancel_attempts_30d: number;     // logins_prev_7d
  offers_declined_30d: number;     // core_actions_last_7d
  offers_accepted_30d: number;     // core_actions_prev_7d
  subscription_canceled: boolean;  // active_users_last_7d > 0
  feedback_submitted_30d: number;  // seats_dropped_last_30d
  bucket_changed_from: string | null;
}

interface CustomerDetail {
  customer_id: string;
  snapshots: Array<{
    date: string;
    risk_score: number;
    risk_bucket: string;
    logins_last_7d: number;
    core_actions_last_7d: number;
    active_users_last_7d: number;
  }>;
  recent_events: Array<{
    event_name: string;
    occurred_at: string;
    event_properties: Record<string, unknown>;
  }>;
  stripe: {
    name: string | null;
    email: string | null;
    created: number;
    subscriptions: Array<{
      id: string;
      status: string;
      plan: string | null;
      amount: number;
      interval: string;
    }>;
  } | null;
}

const BUCKET_TABS: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <Radar className="h-4 w-4" /> },
  { value: 'at_risk', label: 'At Risk', icon: <AlertTriangle className="h-4 w-4" /> },
  { value: 'watch', label: 'Watch', icon: <Eye className="h-4 w-4" /> },
  { value: 'healthy', label: 'Healthy', icon: <CheckCircle2 className="h-4 w-4" /> },
];

// Avatar color palette
const AVATAR_COLORS = [
  { bg: 'bg-red-100', text: 'text-red-700' },
  { bg: 'bg-orange-100', text: 'text-orange-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-green-100', text: 'text-green-700' },
  { bg: 'bg-teal-100', text: 'text-teal-700' },
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  { bg: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-pink-100', text: 'text-pink-700' },
];

function getAvatarColor(email: string) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '??';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(cents: number | null): string {
  if (cents === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export default function ChurnRadarPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerRisk[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [bucket, setBucket] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    atRisk: 0,
    watch: 0,
    healthy: 0,
  });

  useEffect(() => {
    fetchCustomers();
  }, [bucket, page]);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sort: 'risk_score_desc',
      });
      if (bucket !== 'all') {
        params.set('bucket', bucket);
      }

      const response = await fetch(`/api/churn-risk?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCustomers(data.customers);
        setTotal(data.total);

        // Calculate stats from all data (not just current page)
        // For now, we'll fetch all without bucket filter to get accurate stats
        if (bucket === 'all') {
          const atRiskCount = data.customers.filter((c: CustomerRisk) => c.risk_bucket === 'at_risk').length;
          const watchCount = data.customers.filter((c: CustomerRisk) => c.risk_bucket === 'watch').length;
          const healthyCount = data.customers.filter((c: CustomerRisk) => c.risk_bucket === 'healthy').length;
          setStats({
            total: data.total,
            atRisk: atRiskCount,
            watch: watchCount,
            healthy: healthyCount,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomerDetail(customerId: string) {
    try {
      setDetailLoading(true);
      const response = await fetch(`/api/churn-risk?customer_id=${customerId}`);
      const data = await response.json();

      if (response.ok) {
        setCustomerDetail(data);
      }
    } catch (error) {
      console.error('Failed to fetch customer detail:', error);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  }

  function handleCustomerClick(customerId: string) {
    setSelectedCustomer(customerId);
    fetchCustomerDetail(customerId);
  }

  function closeSheet() {
    setSelectedCustomer(null);
    setCustomerDetail(null);
  }

  const selectedCustomerData = customers.find((c) => c.customer_id === selectedCustomer);

  return (
    <AppLayout
      title="Churn Radar"
      description="Monitor customer health and identify at-risk accounts"
      actions={
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tracked</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">At Risk</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.atRisk}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Watch</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.watch}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Healthy</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.healthy}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader className="pb-2">
            {/* Bucket Tabs */}
            <div className="flex gap-2 flex-wrap">
              {BUCKET_TABS.map((tab) => (
                <Button
                  key={tab.value}
                  variant={bucket === tab.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setBucket(tab.value);
                    setPage(1);
                  }}
                  className="gap-2"
                >
                  {tab.icon}
                  {tab.label}
                  {tab.value !== 'all' && (
                    <span className="ml-1 text-xs opacity-70">
                      ({tab.value === 'at_risk' ? stats.atRisk : tab.value === 'watch' ? stats.watch : stats.healthy})
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Radar className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No customers tracked yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Start tracking customer events to see health data here. Events like logins, core actions, and seat changes are used to calculate risk scores.
                </p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="rounded-lg border overflow-hidden">
                  {/* Header */}
                  <div className="grid grid-cols-[2fr_1fr_80px_80px_80px_80px_80px_40px] gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground">
                    <div>Customer</div>
                    <div>Plan</div>
                    <div className="text-right">MRR</div>
                    <div className="text-center">Risk</div>
                    <div className="text-center">Cancels</div>
                    <div className="text-center">Declined</div>
                    <div className="text-center">Status</div>
                    <div></div>
                  </div>

                  {/* Rows */}
                  <div className="divide-y">
                    {customers.map((customer) => {
                      const colors = getRiskBucketColor(customer.risk_bucket);
                      const avatarColor = getAvatarColor(customer.customer_email || customer.customer_id);

                      return (
                        <div
                          key={customer.customer_id}
                          className="grid grid-cols-[2fr_1fr_80px_80px_80px_80px_80px_40px] gap-4 px-4 py-3 items-center hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleCustomerClick(customer.customer_id)}
                        >
                          {/* Customer */}
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className={`h-9 w-9 ${avatarColor.bg}`}>
                              <AvatarFallback className={avatarColor.text}>
                                {getInitials(customer.customer_name, customer.customer_email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {customer.customer_name || customer.customer_email || customer.customer_id}
                              </p>
                              {customer.customer_name && customer.customer_email && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {customer.customer_email}
                                </p>
                              )}
                            </div>
                            {customer.bucket_changed_from && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {customer.bucket_changed_from === 'at_risk' ? (
                                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                                )}
                                Changed
                              </Badge>
                            )}
                          </div>

                          {/* Plan */}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {customer.plan || (customer.plan_id ? 'Custom Plan' : '-')}
                            </p>
                            {customer.plan_id && (
                              <p className="text-xs text-muted-foreground truncate">
                                {customer.plan_id}
                              </p>
                            )}
                          </div>

                          {/* MRR */}
                          <div className="text-sm text-right font-medium">
                            {formatCurrency(customer.mrr)}
                          </div>

                          {/* Risk Badge */}
                          <div className="flex justify-center">
                            <Badge className={`${colors.bg} ${colors.text} ${colors.border} border`}>
                              {getRiskBucketLabel(customer.risk_bucket)}
                            </Badge>
                          </div>

                          {/* Cancel Attempts */}
                          <div className="text-sm text-center">
                            {customer.cancel_attempts_30d > 0 ? (
                              <span className={customer.cancel_attempts_7d > 0 ? 'text-red-600 font-medium' : ''}>
                                {customer.cancel_attempts_30d}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </div>

                          {/* Offers Declined */}
                          <div className="text-sm text-center">
                            {customer.offers_declined_30d > 0 ? (
                              <span className="text-amber-600 font-medium">{customer.offers_declined_30d}</span>
                            ) : customer.offers_accepted_30d > 0 ? (
                              <span className="text-green-600">✓ Saved</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>

                          {/* Status */}
                          <div className="text-sm text-center">
                            {customer.subscription_canceled ? (
                              <span className="text-red-600 font-medium">Canceled</span>
                            ) : (
                              <span className="text-green-600">Active</span>
                            )}
                          </div>

                          {/* Arrow */}
                          <div className="flex justify-end">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pagination */}
                {total > pageSize && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page * pageSize >= total}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Detail Sheet */}
      <Sheet open={!!selectedCustomer} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          {detailLoading ? (
            <>
              <SheetHeader>
                <SheetTitle>Loading...</SheetTitle>
                <SheetDescription>Fetching customer details</SheetDescription>
              </SheetHeader>
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            </>
          ) : selectedCustomerData ? (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className={`h-12 w-12 ${getAvatarColor(selectedCustomerData.customer_email || selectedCustomerData.customer_id).bg}`}>
                    <AvatarFallback className={getAvatarColor(selectedCustomerData.customer_email || selectedCustomerData.customer_id).text}>
                      {getInitials(selectedCustomerData.customer_name, selectedCustomerData.customer_email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>
                      {selectedCustomerData.customer_name || selectedCustomerData.customer_email || 'Unknown Customer'}
                    </SheetTitle>
                    <SheetDescription>
                      {selectedCustomerData.customer_email && selectedCustomerData.customer_name
                        ? selectedCustomerData.customer_email
                        : selectedCustomerData.customer_id}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Risk Score Card */}
                <Card className={`${getRiskBucketColor(selectedCustomerData.risk_bucket).border} border-2`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Risk Score</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-3xl font-bold">{selectedCustomerData.risk_score}</span>
                          <Badge className={`${getRiskBucketColor(selectedCustomerData.risk_bucket).bg} ${getRiskBucketColor(selectedCustomerData.risk_bucket).text}`}>
                            {getRiskBucketLabel(selectedCustomerData.risk_bucket)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Last updated</p>
                        <p>{formatDate(selectedCustomerData.snapshot_date)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-muted-foreground">Cancel Attempts (30d)</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">{selectedCustomerData.cancel_attempts_30d}</p>
                      {selectedCustomerData.cancel_attempts_7d > 0 && (
                        <p className="text-xs text-red-500">{selectedCustomerData.cancel_attempts_7d} in last 7 days</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-amber-500" />
                        <span className="text-sm text-muted-foreground">Offers Declined</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">{selectedCustomerData.offers_declined_30d}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">Offers Accepted</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">{selectedCustomerData.offers_accepted_30d}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Feedback Submitted</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">{selectedCustomerData.feedback_submitted_30d}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Suggested Actions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Suggested Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {getSuggestedActions(selectedCustomerData.risk_bucket).map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5">•</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Historical Trend */}
                {customerDetail?.snapshots && customerDetail.snapshots.length > 1 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Risk Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {customerDetail.snapshots.map((snapshot, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{formatDate(snapshot.date)}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{snapshot.risk_score}</span>
                              <Badge
                                variant="outline"
                                className={`${getRiskBucketColor(snapshot.risk_bucket as RiskBucket).bg} ${getRiskBucketColor(snapshot.risk_bucket as RiskBucket).text}`}
                              >
                                {getRiskBucketLabel(snapshot.risk_bucket as RiskBucket)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Events */}
                {customerDetail?.recent_events && customerDetail.recent_events.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {customerDetail.recent_events.slice(0, 5).map((event, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium capitalize">
                                {event.event_name.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.occurred_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>Customer Details</SheetTitle>
                <SheetDescription>Unable to load customer details</SheetDescription>
              </SheetHeader>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
