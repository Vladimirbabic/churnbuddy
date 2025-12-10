'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Filter,
  Calendar,
  Clock,
  Percent,
  AlertCircle,
  CheckCircle,
  XCircle,
  CreditCard,
  TrendingUp,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Flag from 'react-flagkit';

interface Coupon {
  id: string;
  name: string;
  type: 'percent' | 'amount';
  value: number;
  currency: string;
  duration: string;
  durationInMonths: number | null;
}

interface Customer {
  id: string;
  email: string;
  name: string;
  country: string | null;
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing';
  mrr: number;
  hasDiscount?: boolean;
  createdAt: string;
  currentPlan?: string | null;
}

interface TimelineEvent {
  type: 'subscription_started' | 'discount_applied' | 'cancellation_attempt' | 'offer_accepted' | 'offer_declined' | 'subscription_canceled' | 'payment_failed' | 'payment_recovered';
  date: string;
  description: string;
  details?: Record<string, unknown>;
}

interface CustomerDetail {
  customer: {
    id: string;
    email: string;
    name: string;
    country: string | null;
    createdAt: string;
  };
  subscription: {
    id: string;
    status: string;
    startDate: string;
    daysSubscribed: number;
    currentPlan: string;
    mrr: number;
    lifetimeValue: number;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string;
    cancelAt: string | null;
    canceledAt: string | null;
    daysUntilCancellation: number | null;
  } | null;
  discount: {
    type: 'percent' | 'amount';
    value: number;
    name: string;
    endsAt: string | null;
    daysRemaining: number | null;
  } | null;
  timeline: TimelineEvent[];
  stats: {
    cancellationAttempts: number;
    offersAccepted: number;
    offersDeclined: number;
    paymentFailures: number;
  };
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  active: { label: 'Active', variant: 'success' },
  canceled: { label: 'Canceled', variant: 'destructive' },
  past_due: { label: 'Past Due', variant: 'warning' },
  trialing: { label: 'Trial', variant: 'secondary' },
};

const TIMELINE_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  subscription_started: { icon: <TrendingUp className="h-4 w-4" />, color: 'text-green-600 bg-green-100' },
  discount_applied: { icon: <Percent className="h-4 w-4" />, color: 'text-purple-600 bg-purple-100' },
  cancellation_attempt: { icon: <AlertCircle className="h-4 w-4" />, color: 'text-orange-600 bg-orange-100' },
  offer_accepted: { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600 bg-green-100' },
  offer_declined: { icon: <XCircle className="h-4 w-4" />, color: 'text-red-600 bg-red-100' },
  subscription_canceled: { icon: <X className="h-4 w-4" />, color: 'text-red-600 bg-red-100' },
  payment_failed: { icon: <CreditCard className="h-4 w-4" />, color: 'text-red-600 bg-red-100' },
  payment_recovered: { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600 bg-green-100' },
};

// Color palette for avatars based on email hash
const AVATAR_COLORS = [
  { bg: 'bg-red-100', text: 'text-red-700' },
  { bg: 'bg-orange-100', text: 'text-orange-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  { bg: 'bg-lime-100', text: 'text-lime-700' },
  { bg: 'bg-green-100', text: 'text-green-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-teal-100', text: 'text-teal-700' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  { bg: 'bg-sky-100', text: 'text-sky-700' },
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700' },
  { bg: 'bg-pink-100', text: 'text-pink-700' },
];

// Get consistent color for an email
const getAvatarColor = (email: string) => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filter state
  const [filterCountry, setFilterCountry] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPlan, setFilterPlan] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Discount dialog state
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<string>('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers');
        if (response.ok) {
          const data = await response.json();
          setCustomers(data.customers || []);
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const fetchCoupons = async () => {
    setCouponsLoading(true);
    try {
      const response = await fetch('/api/coupons');
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setCouponsLoading(false);
    }
  };

  const openDiscountDialog = () => {
    setDiscountDialogOpen(true);
    setSelectedCouponId('');
    setDiscountError(null);
    fetchCoupons();
  };

  const applyDiscount = async () => {
    if (!selectedCouponId || !selectedCustomerId) return;

    setApplyingDiscount(true);
    setDiscountError(null);

    try {
      const response = await fetch(`/api/customers/${selectedCustomerId}/discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId: selectedCouponId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDiscountError(data.error || 'Failed to apply discount');
        return;
      }

      // Success - close dialog and refresh customer detail
      setDiscountDialogOpen(false);
      fetchCustomerDetail(selectedCustomerId);
    } catch (error) {
      console.error('Failed to apply discount:', error);
      setDiscountError('Failed to apply discount');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const removeDiscount = async () => {
    if (!selectedCustomerId) return;

    setApplyingDiscount(true);

    try {
      const response = await fetch(`/api/customers/${selectedCustomerId}/discount`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCustomerDetail(selectedCustomerId);
      }
    } catch (error) {
      console.error('Failed to remove discount:', error);
    } finally {
      setApplyingDiscount(false);
    }
  };

  const fetchCustomerDetail = async (customerId: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomerDetail(data);
      }
    } catch (error) {
      console.error('Failed to fetch customer detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCustomerClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
    fetchCustomerDetail(customerId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  // Extract unique filter options from customers
  const uniqueCountries = [...new Set(customers.map(c => c.country).filter(Boolean))] as string[];
  const uniqueStatuses = [...new Set(customers.map(c => c.subscriptionStatus))];
  const uniquePlans = [...new Set(customers.map(c => c.currentPlan).filter(Boolean))] as string[];

  // Count active filters
  const activeFilterCount = [filterCountry, filterStatus, filterPlan].filter(Boolean).length;

  // Clear all filters
  const clearFilters = () => {
    setFilterCountry('');
    setFilterStatus('');
    setFilterPlan('');
  };

  const filteredCustomers = customers.filter(customer => {
    // Search filter
    const matchesSearch = customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase());

    // Country filter
    const matchesCountry = !filterCountry || customer.country === filterCountry;

    // Status filter
    const matchesStatus = !filterStatus || customer.subscriptionStatus === filterStatus;

    // Plan filter
    const matchesPlan = !filterPlan || customer.currentPlan === filterPlan;

    return matchesSearch && matchesCountry && matchesStatus && matchesPlan;
  });

  if (loading) {
    return (
      <AppLayout title="Customers" description="Manage and view customer subscriptions">
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading customers...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Customers" description="Manage and view customer subscriptions">
      <div className="space-y-6">
          {/* Search and filters */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search customers by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button
                variant={showFilters || activeFilterCount > 0 ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 bg-white/20 text-current">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filter dropdowns */}
            {showFilters && (
              <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg border">
                {/* Country filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Country</label>
                  <select
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[120px]"
                  >
                    <option value="">All countries</option>
                    {uniqueCountries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                {/* Status filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[120px]"
                  >
                    <option value="">All statuses</option>
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Plan filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Plan</label>
                  <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
                  >
                    <option value="">All plans</option>
                    {uniquePlans.map(plan => (
                      <option key={plan} value={plan}>{plan}</option>
                    ))}
                  </select>
                </div>

                {/* Clear filters button */}
                {activeFilterCount > 0 && (
                  <div className="flex flex-col gap-1.5 justify-end">
                    <label className="text-xs font-medium text-transparent">Clear</label>
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                      <X className="mr-1 h-3 w-3" />
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {customers.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">No customers yet</h2>
                <p className="text-muted-foreground max-w-md">
                  Connect your Stripe account to sync your customers and start tracking their churn signals.
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/onboarding">
                    <Plus className="mr-2 h-4 w-4" />
                    Connect Stripe
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            // Customer list
            <Card>
              <CardHeader>
                <CardTitle>All Customers</CardTitle>
                <CardDescription>
                  {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-[2fr_100px_1fr_1fr_1fr_auto] gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
                    <div>Customer</div>
                    <div>Country</div>
                    <div>Status</div>
                    <div>Plan</div>
                    <div>MRR</div>
                    <div></div>
                  </div>
                  <div className="divide-y">
                    {filteredCustomers.map((customer) => {
                      const statusConfig = STATUS_CONFIG[customer.subscriptionStatus] || {
                        label: customer.subscriptionStatus,
                        variant: 'secondary' as const,
                      };
                      const avatarColor = getAvatarColor(customer.email);

                      return (
                        <div
                          key={customer.id}
                          className="grid grid-cols-[2fr_100px_1fr_1fr_1fr_auto] gap-4 px-4 py-3 items-center hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => handleCustomerClick(customer.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className={`text-xs ${avatarColor.bg} ${avatarColor.text}`}>
                                {getInitials(customer.name, customer.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {customer.name || customer.email}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {customer.name ? customer.email : customer.id}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                            {customer.country ? (
                              <>
                                <Flag country={customer.country} size={16} />
                                {customer.country}
                              </>
                            ) : '-'}
                          </div>
                          <div>
                            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customer.currentPlan || '-'}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">{formatCurrency(customer.mrr)}</span>
                            {customer.hasDiscount && (
                              <span className="ml-1 text-xs text-purple-600">discounted</span>
                            )}
                          </div>
                          <div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
      </div>

      {/* Customer Detail Sheet */}
      <Sheet open={!!selectedCustomerId} onOpenChange={(open) => !open && setSelectedCustomerId(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          {detailLoading ? (
            <>
              <SheetHeader>
                <SheetTitle>Loading...</SheetTitle>
                <SheetDescription>Fetching customer details</SheetDescription>
              </SheetHeader>
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Loading customer...</p>
                </div>
              </div>
            </>
          ) : customerDetail ? (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className={`text-sm ${getAvatarColor(customerDetail.customer.email).bg} ${getAvatarColor(customerDetail.customer.email).text}`}>
                      {getInitials(customerDetail.customer.name, customerDetail.customer.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-left">
                      {customerDetail.customer.name || customerDetail.customer.email}
                    </SheetTitle>
                    <SheetDescription className="text-left">
                      {customerDetail.customer.name && customerDetail.customer.email}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Customer Info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {customerDetail.customer.country && (
                    <div className="flex items-center gap-1.5">
                      <Flag country={customerDetail.customer.country} size={16} />
                      {customerDetail.customer.country}
                    </div>
                  )}
                  <span className="text-muted-foreground/50">|</span>
                  <span>Customer since {formatDate(customerDetail.customer.createdAt)}</span>
                </div>

                {/* Subscription Stats */}
                {customerDetail.subscription && (
                  <div className="grid grid-cols-3 gap-3">
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xl font-bold">{customerDetail.subscription.daysSubscribed}</p>
                            <p className="text-xs text-muted-foreground">Days subscribed</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-green-100">
                            <CreditCard className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xl font-bold">{formatCurrency(customerDetail.subscription.mrr)}</p>
                            <p className="text-xs text-muted-foreground">Monthly value</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-indigo-100">
                            <TrendingUp className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-xl font-bold">{formatCurrency(customerDetail.subscription.lifetimeValue)}</p>
                            <p className="text-xs text-muted-foreground">Lifetime value</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Cancellation Status */}
                {customerDetail.subscription?.cancelAtPeriodEnd && (
                  <Card className="border-red-200 bg-red-50/50">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-red-100">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-red-900">Scheduled to Cancel</p>
                          <p className="text-sm text-red-700">
                            Subscription will end on {new Date(customerDetail.subscription.currentPeriodEnd).toLocaleDateString()}
                          </p>
                          {customerDetail.subscription.daysUntilCancellation !== null && (
                            <p className="text-xs text-red-600 mt-1 font-medium">
                              {customerDetail.subscription.daysUntilCancellation} days remaining
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Active Discount or Apply Discount Button */}
                {customerDetail.discount ? (
                  <Card className="border-purple-200 bg-purple-50/50">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-purple-100">
                          <Percent className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-purple-900">Active Discount</p>
                          <p className="text-sm text-purple-700">
                            {customerDetail.discount.type === 'percent'
                              ? `${customerDetail.discount.value}% off`
                              : `$${customerDetail.discount.value} off`}
                            {' - '}{customerDetail.discount.name}
                          </p>
                          {customerDetail.discount.daysRemaining !== null && (
                            <p className="text-xs text-purple-600 mt-1">
                              {customerDetail.discount.daysRemaining} days remaining
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                          onClick={removeDiscount}
                          disabled={applyingDiscount}
                        >
                          {applyingDiscount ? 'Removing...' : 'Remove'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : customerDetail.subscription && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={openDiscountDialog}
                  >
                    <Percent className="mr-2 h-4 w-4" />
                    Apply Discount
                  </Button>
                )}

                {/* Quick Stats */}
                {(customerDetail.stats.cancellationAttempts > 0 || customerDetail.stats.offersAccepted > 0) && (
                  <div className="flex gap-4 text-sm">
                    {customerDetail.stats.cancellationAttempts > 0 && (
                      <div className="flex items-center gap-1.5 text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{customerDetail.stats.cancellationAttempts} cancel attempt{customerDetail.stats.cancellationAttempts !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {customerDetail.stats.offersAccepted > 0 && (
                      <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>{customerDetail.stats.offersAccepted} offer{customerDetail.stats.offersAccepted !== 1 ? 's' : ''} accepted</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Activity Timeline
                  </h3>
                  {customerDetail.timeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                      <div className="space-y-4">
                        {customerDetail.timeline.map((event, index) => {
                          const iconConfig = TIMELINE_ICONS[event.type] || {
                            icon: <Clock className="h-4 w-4" />,
                            color: 'text-gray-600 bg-gray-100',
                          };
                          return (
                            <div key={index} className="flex gap-3 relative">
                              <div className={`p-1.5 rounded-full ${iconConfig.color} z-10`}>
                                {iconConfig.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{event.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDateTime(event.date)}
                                </p>
                                {event.details?.cancellation_reason && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Reason: {String(event.details.cancellation_reason)}
                                  </p>
                                )}
                                {event.details?.cancellation_feedback && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    &ldquo;{String(event.details.cancellation_feedback)}&rdquo;
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>Error</SheetTitle>
                <SheetDescription>Unable to load customer</SheetDescription>
              </SheetHeader>
              <div className="flex items-center justify-center py-16">
                <p className="text-muted-foreground">Failed to load customer details</p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Apply Discount Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <DialogDescription>
              Select a coupon to apply to this customer&apos;s subscription.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {couponsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No coupons available.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create coupons in your Stripe dashboard first.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Select value={selectedCouponId} onValueChange={setSelectedCouponId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a coupon" />
                  </SelectTrigger>
                  <SelectContent>
                    {coupons.map((coupon) => (
                      <SelectItem key={coupon.id} value={coupon.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{coupon.name}</span>
                          <span className="text-muted-foreground">
                            ({coupon.type === 'percent' ? `${coupon.value}% off` : `$${coupon.value} off`})
                          </span>
                          {coupon.duration !== 'forever' && (
                            <span className="text-xs text-muted-foreground">
                              - {coupon.duration === 'once' ? 'once' : `${coupon.durationInMonths} months`}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {discountError && (
                  <p className="text-sm text-destructive">{discountError}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={applyDiscount}
              disabled={!selectedCouponId || applyingDiscount}
            >
              {applyingDiscount ? 'Applying...' : 'Apply Discount'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
