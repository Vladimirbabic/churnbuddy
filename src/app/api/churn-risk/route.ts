// =============================================================================
// Churn Risk API Route (Churn Radar)
// =============================================================================
// Returns paginated list of customers with their latest health snapshots.
// Supports filtering by risk bucket and sorting by risk score.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isSupabaseConfigured, getServerSupabase } from '@/lib/supabase';
import Stripe from 'stripe';

// Helper to get authenticated supabase client and user's organization ID
async function getAuthenticatedClient() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return { supabase, orgId: user?.id || null };
  } catch (error) {
    console.error('Auth error:', error);
    return { supabase: null, orgId: null };
  }
}

// Get Stripe client for organization
async function getStripeClient(orgId: string): Promise<Stripe | null> {
  try {
    const supabase = getServerSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settings } = await (supabase as any)
      .from('settings')
      .select('stripe_config')
      .eq('organization_id', orgId)
      .single();

    const stripeConfig = (settings as Record<string, unknown> | null)?.stripe_config as Record<string, unknown> | null;
    // Check both new structure (live.secret_key) and old structure (secret_key)
    const secretKey = (stripeConfig?.live as Record<string, unknown>)?.secret_key as string ||
                      stripeConfig?.secret_key as string ||
                      null;

    if (!secretKey || secretKey === '••••••••') return null;

    return new Stripe(secretKey, { apiVersion: '2023-10-16' });
  } catch {
    return null;
  }
}

interface CustomerRiskData {
  customer_id: string;
  customer_email: string | null;
  customer_name: string | null;
  plan: string | null;
  plan_id: string | null;
  mrr: number | null;
  risk_score: number;
  risk_bucket: string;
  snapshot_date: string;
  // Churn metrics (stored in repurposed columns)
  cancel_attempts_7d: number;
  cancel_attempts_30d: number;
  offers_declined_30d: number;
  offers_accepted_30d: number;
  subscription_canceled: boolean;
  feedback_submitted_30d: number;
  bucket_changed_from: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, orgId } = await getAuthenticatedClient();

    if (!orgId || !supabase) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket'); // healthy, watch, at_risk
    const sort = searchParams.get('sort') || 'risk_score_desc';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '25'), 100);
    const customerId = searchParams.get('customer_id'); // For single customer detail

    // If requesting a specific customer
    if (customerId) {
      return getCustomerDetail(supabase, orgId, customerId);
    }

    // Get latest snapshot per customer using a subquery approach
    // First get all snapshots, then group by customer in JS (Supabase doesn't support DISTINCT ON easily)
    let query = (supabase as ReturnType<typeof createServerClient>)
      .from('customer_health_snapshots')
      .select('*')
      .eq('organization_id', orgId)
      .order('date', { ascending: false });

    if (bucket && ['healthy', 'watch', 'at_risk'].includes(bucket)) {
      query = query.eq('risk_bucket', bucket);
    }

    const { data: allSnapshots, error: snapshotError } = await query;

    if (snapshotError) {
      console.error('Failed to fetch health snapshots:', snapshotError);
      return NextResponse.json(
        { error: 'Failed to fetch health data' },
        { status: 500 }
      );
    }

    // Deduplicate to get latest snapshot per customer
    const latestByCustomer = new Map<string, typeof allSnapshots[0]>();
    for (const snapshot of allSnapshots || []) {
      if (!latestByCustomer.has(snapshot.customer_id)) {
        latestByCustomer.set(snapshot.customer_id, snapshot);
      }
    }

    let customers = Array.from(latestByCustomer.values());

    // Sort
    if (sort === 'risk_score_desc') {
      customers.sort((a, b) => b.risk_score - a.risk_score);
    } else if (sort === 'risk_score_asc') {
      customers.sort((a, b) => a.risk_score - b.risk_score);
    } else if (sort === 'date_desc') {
      customers.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    // Pagination
    const total = customers.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedCustomers = customers.slice(startIndex, startIndex + pageSize);

    // Enrich with Stripe data if available
    const stripe = await getStripeClient(orgId);
    const enrichedCustomers: CustomerRiskData[] = await Promise.all(
      paginatedCustomers.map(async (snapshot) => {
        let customerName: string | null = null;
        let plan: string | null = null;
        let planId: string | null = null;
        let mrr: number | null = null;

        // Try to get Stripe data
        if (stripe && snapshot.customer_id.startsWith('cus_')) {
          try {
            const stripeCustomer = await stripe.customers.retrieve(snapshot.customer_id, {
              expand: ['subscriptions'],
            });

            if (!stripeCustomer.deleted) {
              customerName = stripeCustomer.name || null;

              const subs = stripeCustomer.subscriptions?.data || [];
              const activeSub = subs.find((s) => s.status === 'active' || s.status === 'trialing');
              if (activeSub) {
                const priceData = activeSub.items.data[0]?.price;
                plan = priceData?.nickname || activeSub.items.data[0]?.plan?.nickname || null;
                planId = priceData?.id || null;
                // Calculate MRR
                const amount = priceData?.unit_amount || 0;
                const interval = priceData?.recurring?.interval;
                if (interval === 'year') {
                  mrr = Math.round(amount / 12);
                } else if (interval === 'month') {
                  mrr = amount;
                }
              }
            }
          } catch (err) {
            // Stripe lookup failed, continue without enrichment
            console.warn(`Failed to enrich customer ${snapshot.customer_id}:`, err);
          }
        }

        return {
          customer_id: snapshot.customer_id,
          customer_email: snapshot.customer_email,
          customer_name: customerName,
          plan,
          plan_id: planId,
          mrr,
          risk_score: snapshot.risk_score,
          risk_bucket: snapshot.risk_bucket,
          snapshot_date: snapshot.date,
          // Map repurposed columns to meaningful names
          cancel_attempts_7d: snapshot.logins_last_7d,
          cancel_attempts_30d: snapshot.logins_prev_7d,
          offers_declined_30d: snapshot.core_actions_last_7d,
          offers_accepted_30d: snapshot.core_actions_prev_7d,
          subscription_canceled: snapshot.active_users_last_7d > 0,
          feedback_submitted_30d: snapshot.seats_dropped_last_30d,
          bucket_changed_from: snapshot.bucket_changed_from,
        };
      })
    );

    return NextResponse.json({
      customers: enrichedCustomers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Churn risk API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get detailed data for a single customer
async function getCustomerDetail(
  supabase: ReturnType<typeof createServerClient>,
  orgId: string,
  customerId: string
) {
  // Get last 3 snapshots for trend
  const { data: snapshots, error } = await supabase
    .from('customer_health_snapshots')
    .select('*')
    .eq('organization_id', orgId)
    .eq('customer_id', customerId)
    .order('date', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Failed to fetch customer snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer data' },
      { status: 500 }
    );
  }

  if (!snapshots || snapshots.length === 0) {
    return NextResponse.json(
      { error: 'Customer not found' },
      { status: 404 }
    );
  }

  // Get recent events
  const { data: recentEvents } = await supabase
    .from('customer_events')
    .select('event_name, occurred_at, event_properties')
    .eq('organization_id', orgId)
    .eq('customer_id', customerId)
    .order('occurred_at', { ascending: false })
    .limit(10);

  // Try to get Stripe data
  let stripeData = null;
  const stripe = await getStripeClient(orgId);
  if (stripe && customerId.startsWith('cus_')) {
    try {
      const customer = await stripe.customers.retrieve(customerId, {
        expand: ['subscriptions'],
      });
      if (!customer.deleted) {
        stripeData = {
          name: customer.name,
          email: customer.email,
          created: customer.created,
          subscriptions: customer.subscriptions?.data.map((s) => ({
            id: s.id,
            status: s.status,
            plan: s.items.data[0]?.price?.nickname,
            amount: s.items.data[0]?.price?.unit_amount,
            interval: s.items.data[0]?.price?.recurring?.interval,
            current_period_end: s.current_period_end,
          })),
        };
      }
    } catch {
      // Ignore Stripe errors
    }
  }

  return NextResponse.json({
    customer_id: customerId,
    snapshots,
    recent_events: recentEvents || [],
    stripe: stripeData,
  });
}
