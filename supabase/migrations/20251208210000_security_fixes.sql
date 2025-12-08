-- ============================================================================
-- Security Fixes Migration
-- ============================================================================
-- Fixes the following Supabase linter warnings:
-- 1. RLS Disabled on auth tables (user, session, account, verification)
-- 2. Function search_path mutable on various functions
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON BETTER AUTH TABLES
-- ============================================================================
-- These tables are created by Better Auth and need RLS policies

-- Enable RLS on user table
ALTER TABLE IF EXISTS public."user" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on session table
ALTER TABLE IF EXISTS public.session ENABLE ROW LEVEL SECURITY;

-- Enable RLS on account table
ALTER TABLE IF EXISTS public.account ENABLE ROW LEVEL SECURITY;

-- Enable RLS on verification table
ALTER TABLE IF EXISTS public.verification ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. RLS POLICIES FOR USER TABLE
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own user record" ON public."user";
DROP POLICY IF EXISTS "Users can update their own user record" ON public."user";
DROP POLICY IF EXISTS "Service role can manage all users" ON public."user";

-- Users can view their own record
CREATE POLICY "Users can view their own user record"
  ON public."user" FOR SELECT
  USING (id = auth.uid()::text OR id::uuid = auth.uid());

-- Users can update their own record
CREATE POLICY "Users can update their own user record"
  ON public."user" FOR UPDATE
  USING (id = auth.uid()::text OR id::uuid = auth.uid());

-- Service role has full access
CREATE POLICY "Service role can manage all users"
  ON public."user" FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 3. RLS POLICIES FOR SESSION TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own sessions" ON public.session;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.session;
DROP POLICY IF EXISTS "Service role can manage all sessions" ON public.session;

-- Users can view their own sessions (check both user_id and userId columns)
CREATE POLICY "Users can view their own sessions"
  ON public.session FOR SELECT
  USING (
    user_id = auth.uid()::text OR
    user_id::uuid = auth.uid()
  );

-- Users can delete their own sessions (logout)
CREATE POLICY "Users can delete their own sessions"
  ON public.session FOR DELETE
  USING (
    user_id = auth.uid()::text OR
    user_id::uuid = auth.uid()
  );

-- Service role has full access
CREATE POLICY "Service role can manage all sessions"
  ON public.session FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 4. RLS POLICIES FOR ACCOUNT TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own accounts" ON public.account;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.account;
DROP POLICY IF EXISTS "Service role can manage all accounts" ON public.account;

-- Users can view their own linked accounts
CREATE POLICY "Users can view their own accounts"
  ON public.account FOR SELECT
  USING (
    user_id = auth.uid()::text OR
    user_id::uuid = auth.uid()
  );

-- Users can delete their own linked accounts
CREATE POLICY "Users can delete their own accounts"
  ON public.account FOR DELETE
  USING (
    user_id = auth.uid()::text OR
    user_id::uuid = auth.uid()
  );

-- Service role has full access
CREATE POLICY "Service role can manage all accounts"
  ON public.account FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 5. RLS POLICIES FOR VERIFICATION TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Service role can manage verifications" ON public.verification;

-- Only service role can manage verifications (these are system-generated tokens)
CREATE POLICY "Service role can manage verifications"
  ON public.verification FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 6. FIX FUNCTION SEARCH_PATH ISSUES
-- ============================================================================
-- Recreate functions with explicit search_path to prevent search_path injection

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Fix update_updated_at (if it exists as separate function)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Fix update_maps_updated_at_column (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_maps_updated_at_column') THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.update_maps_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql
    SET search_path = public;
    ';
  END IF;
END $$;

-- Fix create_user_profile
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix increment_cancel_attempt
CREATE OR REPLACE FUNCTION public.increment_cancel_attempt(
  p_organization_id TEXT,
  p_customer_id TEXT,
  p_customer_email TEXT DEFAULT NULL
)
RETURNS public.customer_metrics AS $$
DECLARE
  result public.customer_metrics;
BEGIN
  INSERT INTO public.customer_metrics (
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
    cancel_attempts = public.customer_metrics.cancel_attempts + 1,
    customer_email = COALESCE(EXCLUDED.customer_email, public.customer_metrics.customer_email),
    last_cancel_attempt_at = NOW(),
    updated_at = NOW()
  RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix record_offer_accepted
CREATE OR REPLACE FUNCTION public.record_offer_accepted(
  p_organization_id TEXT,
  p_customer_id TEXT,
  p_customer_email TEXT DEFAULT NULL
)
RETURNS public.customer_metrics AS $$
DECLARE
  result public.customer_metrics;
BEGIN
  INSERT INTO public.customer_metrics (
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
    offers_accepted = public.customer_metrics.offers_accepted + 1,
    customer_email = COALESCE(EXCLUDED.customer_email, public.customer_metrics.customer_email),
    last_offer_accepted_at = NOW(),
    updated_at = NOW()
  RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix record_offer_shown
CREATE OR REPLACE FUNCTION public.record_offer_shown(
  p_organization_id TEXT,
  p_customer_id TEXT,
  p_customer_email TEXT DEFAULT NULL
)
RETURNS public.customer_metrics AS $$
DECLARE
  result public.customer_metrics;
BEGIN
  INSERT INTO public.customer_metrics (
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
    offers_shown = public.customer_metrics.offers_shown + 1,
    customer_email = COALESCE(EXCLUDED.customer_email, public.customer_metrics.customer_email),
    updated_at = NOW()
  RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix get_customer_metrics
CREATE OR REPLACE FUNCTION public.get_customer_metrics(
  p_organization_id TEXT,
  p_customer_id TEXT
)
RETURNS public.customer_metrics AS $$
DECLARE
  result public.customer_metrics;
BEGIN
  SELECT * INTO result
  FROM public.customer_metrics
  WHERE organization_id = p_organization_id
    AND customer_id = p_customer_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix get_churn_metrics
CREATE OR REPLACE FUNCTION public.get_churn_metrics(
  p_organization_id TEXT,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  event_type public.churn_event_type,
  count BIGINT,
  total_mrr_impact BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.event_type,
    COUNT(*)::BIGINT as count,
    COALESCE(SUM((ce.details->>'mrr_impact')::BIGINT), 0)::BIGINT as total_mrr_impact
  FROM public.churn_events ce
  WHERE ce.organization_id = p_organization_id
    AND ce.timestamp >= p_start_date
    AND ce.timestamp <= p_end_date
  GROUP BY ce.event_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This migration:
-- 1. Enabled RLS on user, session, account, verification tables
-- 2. Added appropriate RLS policies for each table
-- 3. Fixed search_path on all functions to prevent injection attacks
-- ============================================================================
