-- ============================================================================
-- Customer Events Table for Churn Intelligence
-- ============================================================================
-- Tracks all customer activity events for health scoring
-- ============================================================================

-- Create the customer_events table
CREATE TABLE IF NOT EXISTS public.customer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_email TEXT,
  event_name TEXT NOT NULL,
  event_properties JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_customer_events_org_customer
  ON public.customer_events(organization_id, customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_events_org_event
  ON public.customer_events(organization_id, event_name);

CREATE INDEX IF NOT EXISTS idx_customer_events_org_occurred
  ON public.customer_events(organization_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_events_occurred
  ON public.customer_events(occurred_at DESC);

-- Enable RLS
ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using optimized pattern with wrapped auth calls)
CREATE POLICY "customer_events_select_policy" ON public.customer_events FOR SELECT
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

CREATE POLICY "customer_events_insert_policy" ON public.customer_events FOR INSERT
WITH CHECK (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

CREATE POLICY "customer_events_update_policy" ON public.customer_events FOR UPDATE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

CREATE POLICY "customer_events_delete_policy" ON public.customer_events FOR DELETE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
