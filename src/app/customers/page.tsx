'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AppLayout } from '@/components/AppLayout';

interface Customer {
  id: string;
  email: string;
  name: string;
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing';
  mrr: number;
  hasDiscount?: boolean;
  createdAt: string;
  currentPlan?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  active: { label: 'Active', variant: 'success' },
  canceled: { label: 'Canceled', variant: 'destructive' },
  past_due: { label: 'Past Due', variant: 'warning' },
  trialing: { label: 'Trial', variant: 'secondary' },
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const filteredCustomers = customers.filter(customer =>
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
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
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
                    <div>Customer</div>
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
                        <div key={customer.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 items-center hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className={`text-xs ${avatarColor.bg} ${avatarColor.text}`}>
                                {getInitials(customer.name, customer.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{customer.email}</p>
                              <p className="text-xs text-muted-foreground">{customer.id}</p>
                            </div>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8">
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
    </AppLayout>
  );
}
