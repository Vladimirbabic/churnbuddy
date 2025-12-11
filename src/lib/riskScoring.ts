/**
 * Risk Scoring Module for Churn Intelligence
 *
 * Pure functions for calculating customer health risk scores.
 * No side effects - only takes metrics in and returns scores out.
 */

export type CustomerMetrics = {
  // Cancel flow activity metrics
  cancel_attempts_7d: number;      // Cancellation attempts in last 7 days
  cancel_attempts_30d: number;     // Cancellation attempts in last 30 days
  offers_declined_30d: number;     // Offers declined in last 30 days
  offers_accepted_30d: number;     // Offers accepted in last 30 days
  subscription_canceled: boolean;  // Has an active cancellation
  feedback_submitted_30d: number;  // Feedback submissions in last 30 days
  days_since_last_event: number | null;  // Days since last cancel flow interaction
};

export type RiskBucket = 'healthy' | 'watch' | 'at_risk';

export type RiskResult = {
  risk_score: number;  // 0 to 100
  risk_bucket: RiskBucket;
  factors: string[];   // List of contributing factors for transparency
};

/**
 * Calculate risk score based on cancel flow activity metrics.
 *
 * Rules:
 * - Cancellation attempt in last 7 days: +35 points (recent intent to cancel)
 * - Subscription actually canceled: +40 points (churned)
 * - Offer declined in last 30 days: +25 points (rejected save attempt)
 * - Multiple cancel attempts (>2 in 30 days): +15 points
 * - Offer accepted in last 30 days: -25 points (positive signal)
 * - No activity ever (new customer): 0 points (healthy default)
 *
 * Buckets:
 * - healthy: score < 30
 * - watch: score 30-59
 * - at_risk: score >= 60
 */
export function calculateRiskScore(metrics: CustomerMetrics): RiskResult {
  let churn_points = 0;
  const factors: string[] = [];

  // Rule 1: Recent cancellation attempt (last 7 days) - strongest signal
  if (metrics.cancel_attempts_7d > 0) {
    churn_points += 35;
    factors.push(`${metrics.cancel_attempts_7d} cancel attempt(s) in last 7 days`);
  }

  // Rule 2: Subscription was actually canceled
  if (metrics.subscription_canceled) {
    churn_points += 40;
    factors.push('Subscription has been canceled');
  }

  // Rule 3: Declined offers - rejected save attempts
  if (metrics.offers_declined_30d > 0) {
    churn_points += 25;
    factors.push(`Declined ${metrics.offers_declined_30d} retention offer(s)`);
  }

  // Rule 4: Multiple cancel attempts in 30 days (persistent churn intent)
  if (metrics.cancel_attempts_30d > 2) {
    churn_points += 15;
    factors.push(`${metrics.cancel_attempts_30d} total cancel attempts in 30 days`);
  }

  // Rule 5: Accepted offers - positive signal (reduce risk)
  if (metrics.offers_accepted_30d > 0) {
    churn_points -= 25;
    factors.push(`Accepted ${metrics.offers_accepted_30d} retention offer(s) (good sign)`);
  }

  // Rule 6: Feedback submitted without canceling - some frustration but engaged
  if (metrics.feedback_submitted_30d > 0 && !metrics.subscription_canceled && metrics.cancel_attempts_7d === 0) {
    churn_points += 10;
    factors.push('Submitted feedback recently');
  }

  // No cancel flow activity = healthy (no signals of churn intent)
  if (metrics.cancel_attempts_30d === 0 && metrics.offers_declined_30d === 0 && !metrics.subscription_canceled) {
    factors.push('No churn signals detected');
  }

  // Clamp score to 0-100
  const risk_score = Math.min(100, Math.max(0, churn_points));

  // Determine bucket
  let risk_bucket: RiskBucket;
  if (risk_score < 30) {
    risk_bucket = 'healthy';
  } else if (risk_score < 60) {
    risk_bucket = 'watch';
  } else {
    risk_bucket = 'at_risk';
  }

  return {
    risk_score,
    risk_bucket,
    factors,
  };
}

/**
 * Get display color for a risk bucket
 */
export function getRiskBucketColor(bucket: RiskBucket): {
  bg: string;
  text: string;
  border: string;
} {
  switch (bucket) {
    case 'healthy':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
      };
    case 'watch':
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
      };
    case 'at_risk':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
      };
  }
}

/**
 * Get display label for a risk bucket
 */
export function getRiskBucketLabel(bucket: RiskBucket): string {
  switch (bucket) {
    case 'healthy':
      return 'Healthy';
    case 'watch':
      return 'Watch';
    case 'at_risk':
      return 'At Risk';
  }
}

/**
 * Get suggested actions based on risk bucket
 */
export function getSuggestedActions(bucket: RiskBucket): string[] {
  switch (bucket) {
    case 'healthy':
      return [
        'Continue monitoring for changes',
        'Consider upsell opportunities',
        'Request testimonial or referral',
      ];
    case 'watch':
      return [
        'Schedule a check-in call',
        'Send personalized outreach email',
        'Review their recent feedback',
        'Monitor for further decline',
      ];
    case 'at_risk':
      return [
        'Reach out immediately with personal touch',
        'Offer a discovery call to understand blockers',
        'Consider a custom retention offer',
        'Review their cancellation feedback',
        'Escalate to customer success lead',
      ];
  }
}
