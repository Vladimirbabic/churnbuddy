// =============================================================================
// Daily Health Cron Job
// =============================================================================
// Runs daily to calculate customer health snapshots and risk scores.
// Triggered by Vercel Cron at 6 AM UTC.
//
// Flow:
// 1. Get all organizations with active subscriptions
// 2. For each org, get unique customers from churn_events
// 3. Aggregate cancel flow metrics for each customer
// 4. Calculate risk score using riskScoring module
// 5. Compare with previous snapshot for bucket change detection
// 6. Insert new snapshot
// 7. Trigger notifications for bucket changes

import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { calculateRiskScore, CustomerMetrics } from '@/lib/riskScoring';
import {
  notifyAccountAtRisk,
  notifyAccountImproved,
  notifyDailyHealthComplete,
  CustomerHealthSnapshot,
} from '@/lib/churnNotifications';

// Verify cron secret for Vercel Cron jobs
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If no secret configured, allow (for local dev)
  if (!cronSecret) return true;

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify this is a legitimate cron request
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = {
    organizationsProcessed: 0,
    customersProcessed: 0,
    newAtRisk: 0,
    improved: 0,
    errors: 0,
    durationMs: 0,
  };

  try {
    const supabase = getServerSupabase();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Step 1: Get all organizations with active subscriptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriptions, error: subError } = await (supabase as any)
      .from('subscriptions')
      .select('organization_id')
      .in('status', ['active', 'trialing']);

    if (subError) {
      console.error('Failed to fetch subscriptions:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    const orgIds = (subscriptions as Array<{ organization_id: string }> | null)?.map((s) => s.organization_id) || [];
    console.log(`[DailyHealth] Processing ${orgIds.length} organizations`);

    // Process each organization
    for (const orgId of orgIds) {
      try {
        await processOrganization(supabase, orgId, today, stats);
        stats.organizationsProcessed++;
      } catch (err) {
        console.error(`[DailyHealth] Error processing org ${orgId}:`, err);
        stats.errors++;
      }
    }

    stats.durationMs = Date.now() - startTime;

    // Send summary notification
    await notifyDailyHealthComplete(stats);

    return NextResponse.json({
      success: true,
      message: 'Daily health job completed',
      stats,
    });
  } catch (error) {
    console.error('[DailyHealth] Fatal error:', error);
    stats.durationMs = Date.now() - startTime;
    return NextResponse.json({
      error: 'Daily health job failed',
      stats,
    }, { status: 500 });
  }
}

async function processOrganization(
  supabase: ReturnType<typeof getServerSupabase>,
  orgId: string,
  today: string,
  stats: { customersProcessed: number; newAtRisk: number; improved: number; errors: number }
) {
  // Step 2: Get unique customers from churn_events (cancel flow interactions)
  type CustomerRecord = { customer_id: string; customer_email: string | null };
  const uniqueCustomers = new Map<string, string | null>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: churnCustomers, error: churnError } = await (supabase as any)
    .from('churn_events')
    .select('customer_id, customer_email')
    .eq('organization_id', orgId)
    .neq('customer_id', 'preview') // Exclude preview customers
    .order('created_at', { ascending: false });

  if (churnError) {
    console.error(`Failed to fetch churn customers: ${churnError.message}`);
    return;
  }

  // Deduplicate customers (keep first occurrence which has most recent email)
  for (const c of (churnCustomers as CustomerRecord[] | null) || []) {
    if (c.customer_id && !uniqueCustomers.has(c.customer_id)) {
      uniqueCustomers.set(c.customer_id, c.customer_email);
    }
  }

  console.log(`[DailyHealth] Org ${orgId}: ${uniqueCustomers.size} unique customers`);

  // Process each customer
  for (const [customerId, customerEmail] of uniqueCustomers) {
    try {
      await processCustomer(supabase, orgId, customerId, customerEmail, today, stats);
      stats.customersProcessed++;
    } catch (err) {
      console.error(`[DailyHealth] Error processing customer ${customerId}:`, err);
      stats.errors++;
    }
  }
}

async function processCustomer(
  supabase: ReturnType<typeof getServerSupabase>,
  orgId: string,
  customerId: string,
  customerEmail: string | null,
  today: string,
  stats: { newAtRisk: number; improved: number }
) {
  const now = new Date();

  // Calculate time windows
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Step 3: Aggregate cancel flow metrics
  const metrics = await aggregateChurnMetrics(
    supabase,
    orgId,
    customerId,
    {
      now,
      sevenDaysAgo,
      thirtyDaysAgo,
    }
  );

  // Step 4: Calculate risk score
  const { risk_score, risk_bucket } = calculateRiskScore(metrics);

  // Step 5: Get previous snapshot to detect bucket changes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prevSnapshot } = await (supabase as any)
    .from('customer_health_snapshots')
    .select('risk_bucket')
    .eq('organization_id', orgId)
    .eq('customer_id', customerId)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  const previousBucket = (prevSnapshot as { risk_bucket: string } | null)?.risk_bucket || null;
  const bucketChanged = previousBucket && previousBucket !== risk_bucket;

  // Step 6: Insert new snapshot
  const snapshotData = {
    organization_id: orgId,
    customer_id: customerId,
    customer_email: customerEmail,
    date: today,
    // Store the churn metrics in the existing columns (repurposed)
    logins_last_7d: metrics.cancel_attempts_7d,
    logins_prev_7d: metrics.cancel_attempts_30d,
    core_actions_last_7d: metrics.offers_declined_30d,
    core_actions_prev_7d: metrics.offers_accepted_30d,
    active_users_last_7d: metrics.subscription_canceled ? 1 : 0,
    seats_dropped_last_30d: metrics.feedback_submitted_30d,
    risk_score,
    risk_bucket,
    bucket_changed_from: bucketChanged ? previousBucket : null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newSnapshot, error: insertError } = await (supabase as any)
    .from('customer_health_snapshots')
    .upsert(snapshotData, {
      onConflict: 'organization_id,customer_id,date',
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to insert snapshot: ${insertError.message}`);
  }

  // Step 7: Trigger notifications for bucket changes
  if (bucketChanged && newSnapshot) {
    const snapshot = newSnapshot as CustomerHealthSnapshot;

    if (risk_bucket === 'at_risk') {
      stats.newAtRisk++;
      await notifyAccountAtRisk(orgId, customerId, snapshot);
    } else if (previousBucket === 'at_risk') {
      stats.improved++;
      await notifyAccountImproved(orgId, customerId, snapshot);
    }
  }
}

async function aggregateChurnMetrics(
  supabase: ReturnType<typeof getServerSupabase>,
  orgId: string,
  customerId: string,
  windows: {
    now: Date;
    sevenDaysAgo: Date;
    thirtyDaysAgo: Date;
  }
): Promise<CustomerMetrics> {
  const { now, sevenDaysAgo, thirtyDaysAgo } = windows;

  // Helper to count churn events by type
  async function countChurnEvents(
    eventType: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error } = await (supabase as any)
      .from('churn_events')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('customer_id', customerId)
      .eq('event_type', eventType)
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());

    if (error) {
      console.error(`Failed to count ${eventType} events:`, error);
      return 0;
    }
    return count || 0;
  }

  // Check if customer has an active cancellation (subscription_canceled event)
  async function hasSubscriptionCanceled(): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error } = await (supabase as any)
      .from('churn_events')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('customer_id', customerId)
      .eq('event_type', 'subscription_canceled')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Failed to check subscription_canceled:', error);
      return false;
    }
    return (count || 0) > 0;
  }

  // Get days since last event
  async function getDaysSinceLastEvent(): Promise<number | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('churn_events')
      .select('created_at')
      .eq('organization_id', orgId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    const lastEventDate = new Date((data as { created_at: string }).created_at);
    const diffMs = now.getTime() - lastEventDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Run aggregations in parallel for efficiency
  const [
    cancelAttempts7d,
    cancelAttempts30d,
    offersDeclined30d,
    offersAccepted30d,
    subscriptionCanceled,
    feedbackSubmitted30d,
    daysSinceLastEvent,
  ] = await Promise.all([
    countChurnEvents('cancellation_attempt', sevenDaysAgo, now),
    countChurnEvents('cancellation_attempt', thirtyDaysAgo, now),
    countChurnEvents('offer_declined', thirtyDaysAgo, now),
    countChurnEvents('offer_accepted', thirtyDaysAgo, now),
    hasSubscriptionCanceled(),
    countChurnEvents('feedback_submitted', thirtyDaysAgo, now),
    getDaysSinceLastEvent(),
  ]);

  return {
    cancel_attempts_7d: cancelAttempts7d,
    cancel_attempts_30d: cancelAttempts30d,
    offers_declined_30d: offersDeclined30d,
    offers_accepted_30d: offersAccepted30d,
    subscription_canceled: subscriptionCanceled,
    feedback_submitted_30d: feedbackSubmitted30d,
    days_since_last_event: daysSinceLastEvent,
  };
}

// Also support POST for manual triggers (useful for testing)
export async function POST(request: NextRequest) {
  return GET(request);
}
