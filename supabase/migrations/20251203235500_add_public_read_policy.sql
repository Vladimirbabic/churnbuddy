-- Add public read policy for cancel flows embed widget
-- This allows the embed script to fetch flow configuration without authentication
-- Only active flows can be read publicly (the UUID acts as a "secret" link)

-- Fix: The embed widget calls /api/flow-config from external sites without authentication
-- Without this policy, RLS blocks all reads and returns "Failed to load configuration"

DROP POLICY IF EXISTS "Public can read active cancel flows" ON cancel_flows;

CREATE POLICY "Public can read active cancel flows"
  ON cancel_flows FOR SELECT
  USING (is_active = true);




