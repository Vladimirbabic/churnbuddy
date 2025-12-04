-- ============================================================================
-- Customer Metrics Table
-- ============================================================================
-- Tracks per-customer metrics like cancel attempts, offers shown, etc.
-- This makes it easy to query customer churn risk without counting events.

CREATE TABLE IF NOT EXISTS customer_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_email TEXT,

  -- Cancel flow metrics
  cancel_attempts INTEGER NOT NULL DEFAULT 0,
  offers_shown INTEGER NOT NULL DEFAULT 0,
  offers_accepted INTEGER NOT NULL DEFAULT 0,
  offers_declined INTEGER NOT NULL DEFAULT 0,

  -- Payment metrics
  failed_payments INTEGER NOT NULL DEFAULT 0,
  recovered_payments INTEGER NOT NULL DEFAULT 0,

  -- Status
  last_cancel_attempt_at TIMESTAMPTZ,
  last_offer_accepted_at TIMESTAMPTZ,
  last_failed_payment_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint per org + customer
  UNIQUE(organization_id, customer_id)
);

-- Indexes
CREATE INDEX idx_customer_metrics_org_id ON customer_metrics(organization_id);
CREATE INDEX idx_customer_metrics_customer_id ON customer_metrics(customer_id);
CREATE INDEX idx_customer_metrics_cancel_attempts ON customer_metrics(organization_id, cancel_attempts DESC);
CREATE INDEX idx_customer_metrics_org_customer ON customer_metrics(organization_id, customer_id);

-- Updated_at trigger
CREATE TRIGGER update_customer_metrics_updated_at
  BEFORE UPDATE ON customer_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE customer_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own customer metrics"
  ON customer_metrics FOR ALL
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Service role can manage customer metrics"
  ON customer_metrics FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Function to increment cancel attempts
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_cancel_attempt(
  p_organization_id TEXT,
  p_customer_id TEXT,
  p_customer_email TEXT DEFAULT NULL
)
RETURNS customer_metrics AS $$
DECLARE
  result customer_metrics;
BEGIN
  INSERT INTO customer_metrics (
    organization_id,
    customer_id,
    customer_email,
    cancel_attempts,
    last_cancel_attempt_at
  )
  VALUES (
    p_organization_id,
    p_customer_id,
    p_customer_email,
    1,
    NOW()
  )
  ON CONFLICT (organization_id, customer_id)
  DO UPDATE SET
    cancel_attempts = customer_metrics.cancel_attempts + 1,
    customer_email = COALESCE(EXCLUDED.customer_email, customer_metrics.customer_email),
    last_cancel_attempt_at = NOW(),
    updated_at = NOW()
  RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to record offer accepted
-- ============================================================================
CREATE OR REPLACE FUNCTION record_offer_accepted(
  p_organization_id TEXT,
  p_customer_id TEXT,
  p_customer_email TEXT DEFAULT NULL
)
RETURNS customer_metrics AS $$
DECLARE
  result customer_metrics;
BEGIN
  INSERT INTO customer_metrics (
    organization_id,
    customer_id,
    customer_email,
    offers_shown,
    offers_accepted,
    last_offer_accepted_at
  )
  VALUES (
    p_organization_id,
    p_customer_id,
    p_customer_email,
    1,
    1,
    NOW()
  )
  ON CONFLICT (organization_id, customer_id)
  DO UPDATE SET
    offers_accepted = customer_metrics.offers_accepted + 1,
    customer_email = COALESCE(EXCLUDED.customer_email, customer_metrics.customer_email),
    last_offer_accepted_at = NOW(),
    updated_at = NOW()
  RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to record offer shown (declined or ignored)
-- ============================================================================
CREATE OR REPLACE FUNCTION record_offer_shown(
  p_organization_id TEXT,
  p_customer_id TEXT,
  p_customer_email TEXT DEFAULT NULL
)
RETURNS customer_metrics AS $$
DECLARE
  result customer_metrics;
BEGIN
  INSERT INTO customer_metrics (
    organization_id,
    customer_id,
    customer_email,
    offers_shown
  )
  VALUES (
    p_organization_id,
    p_customer_id,
    p_customer_email,
    1
  )
  ON CONFLICT (organization_id, customer_id)
  DO UPDATE SET
    offers_shown = customer_metrics.offers_shown + 1,
    customer_email = COALESCE(EXCLUDED.customer_email, customer_metrics.customer_email),
    updated_at = NOW()
  RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to get customer metrics
-- ============================================================================
CREATE OR REPLACE FUNCTION get_customer_metrics(
  p_organization_id TEXT,
  p_customer_id TEXT
)
RETURNS customer_metrics AS $$
DECLARE
  result customer_metrics;
BEGIN
  SELECT * INTO result
  FROM customer_metrics
  WHERE organization_id = p_organization_id
    AND customer_id = p_customer_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
