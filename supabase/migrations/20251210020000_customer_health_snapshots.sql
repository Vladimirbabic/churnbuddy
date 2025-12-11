-- ============================================================================
-- Customer Health Snapshots Table for Churn Intelligence
-- ============================================================================
-- Daily health calculations per customer with risk scoring
-- ============================================================================

-- Create enum for risk buckets
DO $$ BEGIN
  CREATE TYPE risk_bucket AS ENUM ('healthy', 'watch', 'at_risk');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create the customer_health_snapshots table
CREATE TABLE IF NOT EXISTS public.customer_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_email TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Activity metrics
  logins_last_7d INTEGER NOT NULL DEFAULT 0,
  logins_prev_7d INTEGER NOT NULL DEFAULT 0,
  core_actions_last_7d INTEGER NOT NULL DEFAULT 0,
  core_actions_prev_7d INTEGER NOT NULL DEFAULT 0,
  active_users_last_7d INTEGER NOT NULL DEFAULT 0,
  seats_dropped_last_30d INTEGER NOT NULL DEFAULT 0,

  -- Risk assessment
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_bucket TEXT NOT NULL DEFAULT 'healthy' CHECK (risk_bucket IN ('healthy', 'watch', 'at_risk')),
  bucket_changed_from TEXT CHECK (bucket_changed_from IS NULL OR bucket_changed_from IN ('healthy', 'watch', 'at_risk')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one snapshot per customer per day
  CONSTRAINT unique_customer_date UNIQUE (organization_id, customer_id, date)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_health_snapshots_org_bucket
  ON public.customer_health_snapshots(organization_id, risk_bucket);

CREATE INDEX IF NOT EXISTS idx_health_snapshots_org_date
  ON public.customer_health_snapshots(organization_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_health_snapshots_org_customer_date
  ON public.customer_health_snapshots(organization_id, customer_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_health_snapshots_risk_score
  ON public.customer_health_snapshots(organization_id, risk_score DESC);

-- Enable RLS
ALTER TABLE public.customer_health_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using optimized pattern with wrapped auth calls)
CREATE POLICY "health_snapshots_select_policy" ON public.customer_health_snapshots FOR SELECT
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

CREATE POLICY "health_snapshots_insert_policy" ON public.customer_health_snapshots FOR INSERT
WITH CHECK (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

CREATE POLICY "health_snapshots_update_policy" ON public.customer_health_snapshots FOR UPDATE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

CREATE POLICY "health_snapshots_delete_policy" ON public.customer_health_snapshots FOR DELETE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
