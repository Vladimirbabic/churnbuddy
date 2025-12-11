/**
 * Churn Notifications Module
 *
 * Handles notifications when customer risk status changes.
 * Initial implementation logs structured messages.
 * Can be extended to send Slack/email notifications.
 */

export interface CustomerHealthSnapshot {
  id: string;
  organization_id: string;
  customer_id: string;
  customer_email?: string;
  date: string;
  logins_last_7d: number;
  logins_prev_7d: number;
  core_actions_last_7d: number;
  core_actions_prev_7d: number;
  active_users_last_7d: number;
  seats_dropped_last_30d: number;
  risk_score: number;
  risk_bucket: 'healthy' | 'watch' | 'at_risk';
  bucket_changed_from: string | null;
}

/**
 * Notify when an account moves to at_risk status.
 * Only called when bucket_changed_from is set and new bucket is 'at_risk'.
 */
export async function notifyAccountAtRisk(
  organizationId: string,
  customerId: string,
  snapshot: CustomerHealthSnapshot
): Promise<void> {
  // Calculate percentage drops
  const loginDrop = snapshot.logins_prev_7d > 0
    ? Math.round((1 - snapshot.logins_last_7d / snapshot.logins_prev_7d) * 100)
    : 0;

  const actionDrop = snapshot.core_actions_prev_7d > 0
    ? Math.round((1 - snapshot.core_actions_last_7d / snapshot.core_actions_prev_7d) * 100)
    : 0;

  // Build notification message
  const message = {
    type: 'account_at_risk',
    timestamp: new Date().toISOString(),
    organizationId,
    customerId,
    customerEmail: snapshot.customer_email,
    riskScore: snapshot.risk_score,
    previousBucket: snapshot.bucket_changed_from,
    newBucket: snapshot.risk_bucket,
    metrics: {
      loginDrop: loginDrop > 0 ? `${loginDrop}%` : 'N/A',
      actionDrop: actionDrop > 0 ? `${actionDrop}%` : 'N/A',
      activeUsers: snapshot.active_users_last_7d,
      seatsDropped: snapshot.seats_dropped_last_30d,
    },
  };

  // Log structured message (easily parsed by log aggregators)
  console.log('[CHURN_ALERT]', JSON.stringify(message));

  // TODO: Future enhancements
  // - Send Slack notification
  // - Send email to account owner
  // - Create task in CRM
  // - Trigger workflow automation
}

/**
 * Notify when an account improves from at_risk.
 * Called when bucket changes from 'at_risk' to something better.
 */
export async function notifyAccountImproved(
  organizationId: string,
  customerId: string,
  snapshot: CustomerHealthSnapshot
): Promise<void> {
  const message = {
    type: 'account_improved',
    timestamp: new Date().toISOString(),
    organizationId,
    customerId,
    customerEmail: snapshot.customer_email,
    riskScore: snapshot.risk_score,
    previousBucket: snapshot.bucket_changed_from,
    newBucket: snapshot.risk_bucket,
  };

  console.log('[CHURN_IMPROVEMENT]', JSON.stringify(message));
}

/**
 * Summary notification for daily health job completion.
 */
export async function notifyDailyHealthComplete(
  stats: {
    organizationsProcessed: number;
    customersProcessed: number;
    newAtRisk: number;
    improved: number;
    errors: number;
    durationMs: number;
  }
): Promise<void> {
  const message = {
    type: 'daily_health_complete',
    timestamp: new Date().toISOString(),
    ...stats,
  };

  console.log('[DAILY_HEALTH_COMPLETE]', JSON.stringify(message));
}
