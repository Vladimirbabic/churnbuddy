-- Track which conversions came from email sequences
-- This allows us to measure: "Did our dunning/winback emails actually work?"

CREATE TABLE IF NOT EXISTS sequence_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  customer_email TEXT,

  -- Which sequence gets credit
  sequence_type TEXT NOT NULL CHECK (sequence_type IN ('dunning', 'winback', 'cancel_save')),

  -- What type of conversion happened
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('payment_recovered', 'resubscribed', 'stayed')),

  -- Email sequence details at time of conversion
  emails_sent INTEGER NOT NULL DEFAULT 0, -- how many emails in sequence were sent before conversion
  last_email_type TEXT, -- e.g. 'dunning_2', 'winback_1'
  last_email_sent_at TIMESTAMPTZ,

  -- Conversion details
  converted_at TIMESTAMPTZ DEFAULT NOW(),
  stripe_event_id TEXT UNIQUE, -- for deduplication
  subscription_id TEXT,
  invoice_id TEXT,

  -- Flexible details storage
  details JSONB DEFAULT '{}'::jsonb,
  -- e.g. { recovered_amount: 4900, currency: 'usd', days_since_first_email: 5 }

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sequence_attribution_org
  ON sequence_attribution(organization_id);
CREATE INDEX IF NOT EXISTS idx_sequence_attribution_customer
  ON sequence_attribution(customer_id);
CREATE INDEX IF NOT EXISTS idx_sequence_attribution_type
  ON sequence_attribution(sequence_type, conversion_type);
CREATE INDEX IF NOT EXISTS idx_sequence_attribution_converted
  ON sequence_attribution(organization_id, converted_at DESC);

-- RLS policies
ALTER TABLE sequence_attribution ENABLE ROW LEVEL SECURITY;

-- Users can only see their organization's attributions
CREATE POLICY "Users can view own org sequence_attribution"
  ON sequence_attribution FOR SELECT
  USING (organization_id = auth.uid());

-- Service role can insert (from webhooks)
CREATE POLICY "Service can insert sequence_attribution"
  ON sequence_attribution FOR INSERT
  WITH CHECK (true);

-- Helper function to get sequence metrics
CREATE OR REPLACE FUNCTION get_sequence_metrics(
  p_organization_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  sequence_type TEXT,
  conversion_type TEXT,
  total_conversions BIGINT,
  avg_emails_before_conversion NUMERIC,
  total_emails_sent BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.sequence_type,
    sa.conversion_type,
    COUNT(*)::BIGINT as total_conversions,
    ROUND(AVG(sa.emails_sent), 1) as avg_emails_before_conversion,
    SUM(sa.emails_sent)::BIGINT as total_emails_sent
  FROM sequence_attribution sa
  WHERE sa.organization_id = p_organization_id
    AND sa.converted_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY sa.sequence_type, sa.conversion_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
