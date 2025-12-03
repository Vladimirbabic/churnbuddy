-- Churn Events table for comprehensive event logging and analytics
-- Migration: 00003_create_churn_events

-- Create enum types
CREATE TYPE churn_event_type AS ENUM (
  'payment_failed',
  'payment_retry_sent',
  'payment_recovered',
  'cancellation_attempt',
  'offer_accepted',
  'offer_declined',
  'subscription_canceled',
  'subscription_updated',
  'subscription_recovered'
);

CREATE TYPE churn_event_source AS ENUM ('webhook', 'cancel_flow', 'api', 'manual');

-- Create churn_events table
CREATE TABLE churn_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  event_type churn_event_type NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Customer info
  customer_id TEXT NOT NULL,
  customer_email TEXT,
  subscription_id TEXT,
  invoice_id TEXT,

  -- Event details (flexible JSONB for various event types)
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example details structure:
  -- {
  --   "failure_reason": "card_declined",
  --   "failure_code": "insufficient_funds",
  --   "cancellation_reason": "too_expensive",
  --   "cancellation_feedback": "Free text feedback",
  --   "discount_offered": 20,
  --   "discount_accepted": true,
  --   "amount_due": 1999,
  --   "currency": "usd",
  --   "plan_id": "price_xxx",
  --   "previous_status": "active",
  --   "new_status": "canceled",
  --   "mrr_impact": -1999
  -- }

  -- Metadata
  source churn_event_source NOT NULL DEFAULT 'api',
  processed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_churn_events_organization_id ON churn_events(organization_id);
CREATE INDEX idx_churn_events_event_type ON churn_events(event_type);
CREATE INDEX idx_churn_events_timestamp ON churn_events(timestamp DESC);
CREATE INDEX idx_churn_events_customer_id ON churn_events(customer_id);
CREATE INDEX idx_churn_events_customer_email ON churn_events(customer_email);
CREATE INDEX idx_churn_events_subscription_id ON churn_events(subscription_id);
CREATE INDEX idx_churn_events_type_timestamp ON churn_events(event_type, timestamp DESC);
CREATE INDEX idx_churn_events_customer_timestamp ON churn_events(customer_id, timestamp DESC);
CREATE INDEX idx_churn_events_org_timestamp ON churn_events(organization_id, timestamp DESC);

-- Partial index for invoice_id (only when not null)
CREATE INDEX idx_churn_events_invoice_id ON churn_events(invoice_id) WHERE invoice_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE churn_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own churn events"
  ON churn_events FOR SELECT
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Users can insert their own churn events"
  ON churn_events FOR INSERT
  WITH CHECK (auth.uid()::text = organization_id);

CREATE POLICY "Users can update their own churn events"
  ON churn_events FOR UPDATE
  USING (auth.uid()::text = organization_id);

-- Function to get metrics aggregation
CREATE OR REPLACE FUNCTION get_churn_metrics(
  p_organization_id TEXT,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  event_type churn_event_type,
  count BIGINT,
  total_mrr_impact BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.event_type,
    COUNT(*)::BIGINT as count,
    COALESCE(SUM((ce.details->>'mrr_impact')::BIGINT), 0)::BIGINT as total_mrr_impact
  FROM churn_events ce
  WHERE ce.organization_id = p_organization_id
    AND ce.timestamp >= p_start_date
    AND ce.timestamp <= p_end_date
  GROUP BY ce.event_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
