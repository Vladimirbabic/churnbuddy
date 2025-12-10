-- ============================================================================
-- RLS Performance Optimization Migration
-- ============================================================================
-- Fixes two types of Supabase linter warnings:
-- 1. auth_rls_initplan: Wrap auth.uid() and auth.jwt() in (select ...) for caching
-- 2. multiple_permissive_policies: Consolidate duplicate policies
-- ============================================================================

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can manage own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow demo org full access to subscriptions" ON public.subscriptions;

-- Consolidated policy: Users can view their own OR service role has full access
CREATE POLICY "subscriptions_select_policy" ON public.subscriptions FOR SELECT
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

-- Consolidated policy: Users can update their own OR service role has full access
CREATE POLICY "subscriptions_update_policy" ON public.subscriptions FOR UPDATE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

-- Service role can insert
CREATE POLICY "subscriptions_insert_policy" ON public.subscriptions FOR INSERT
WITH CHECK (
  (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

-- Service role can delete
CREATE POLICY "subscriptions_delete_policy" ON public.subscriptions FOR DELETE
USING (
  (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

-- ============================================================================
-- CANCEL_FLOWS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage their own cancel flows" ON public.cancel_flows;
DROP POLICY IF EXISTS "Users can manage own cancel flows" ON public.cancel_flows;
DROP POLICY IF EXISTS "Service role can manage cancel flows" ON public.cancel_flows;
DROP POLICY IF EXISTS "Public can read active cancel flows" ON public.cancel_flows;
DROP POLICY IF EXISTS "Allow demo org full access to cancel_flows" ON public.cancel_flows;

-- Consolidated SELECT: owner, service role, demo org, or public active flows
CREATE POLICY "cancel_flows_select_policy" ON public.cancel_flows FOR SELECT
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
  OR is_active = true
);

-- Consolidated INSERT
CREATE POLICY "cancel_flows_insert_policy" ON public.cancel_flows FOR INSERT
WITH CHECK (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

-- Consolidated UPDATE
CREATE POLICY "cancel_flows_update_policy" ON public.cancel_flows FOR UPDATE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

-- Consolidated DELETE
CREATE POLICY "cancel_flows_delete_policy" ON public.cancel_flows FOR DELETE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

-- ============================================================================
-- CHURN_EVENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage their own churn events" ON public.churn_events;
DROP POLICY IF EXISTS "Users can manage own churn events" ON public.churn_events;
DROP POLICY IF EXISTS "Service role can manage churn events" ON public.churn_events;
DROP POLICY IF EXISTS "Allow demo org full access to churn_events" ON public.churn_events;

CREATE POLICY "churn_events_select_policy" ON public.churn_events FOR SELECT
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

CREATE POLICY "churn_events_insert_policy" ON public.churn_events FOR INSERT
WITH CHECK (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

CREATE POLICY "churn_events_update_policy" ON public.churn_events FOR UPDATE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

CREATE POLICY "churn_events_delete_policy" ON public.churn_events FOR DELETE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

-- ============================================================================
-- EMAIL_TEMPLATES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage their own email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can manage own email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Service role can manage email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Allow demo org full access to email_templates" ON public.email_templates;

CREATE POLICY "email_templates_select_policy" ON public.email_templates FOR SELECT
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

CREATE POLICY "email_templates_insert_policy" ON public.email_templates FOR INSERT
WITH CHECK (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

CREATE POLICY "email_templates_update_policy" ON public.email_templates FOR UPDATE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

CREATE POLICY "email_templates_delete_policy" ON public.email_templates FOR DELETE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

-- ============================================================================
-- SETTINGS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can manage own settings" ON public.settings;
DROP POLICY IF EXISTS "Service role can manage settings" ON public.settings;
DROP POLICY IF EXISTS "Allow demo org full access to settings" ON public.settings;

CREATE POLICY "settings_select_policy" ON public.settings FOR SELECT
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

CREATE POLICY "settings_insert_policy" ON public.settings FOR INSERT
WITH CHECK (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

CREATE POLICY "settings_update_policy" ON public.settings FOR UPDATE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

CREATE POLICY "settings_delete_policy" ON public.settings FOR DELETE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR organization_id = 'demo-org-123'
);

-- ============================================================================
-- EMAIL_SENDS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own email sends" ON public.email_sends;
DROP POLICY IF EXISTS "Users can insert their own email sends" ON public.email_sends;
DROP POLICY IF EXISTS "Service role can manage email sends" ON public.email_sends;

CREATE POLICY "email_sends_select_policy" ON public.email_sends FOR SELECT
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "email_sends_insert_policy" ON public.email_sends FOR INSERT
WITH CHECK (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

-- ============================================================================
-- CUSTOMER_METRICS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage their own customer metrics" ON public.customer_metrics;
DROP POLICY IF EXISTS "Service role can manage customer metrics" ON public.customer_metrics;

CREATE POLICY "customer_metrics_select_policy" ON public.customer_metrics FOR SELECT
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "customer_metrics_insert_policy" ON public.customer_metrics FOR INSERT
WITH CHECK (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "customer_metrics_update_policy" ON public.customer_metrics FOR UPDATE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "customer_metrics_delete_policy" ON public.customer_metrics FOR DELETE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

-- ============================================================================
-- EMAIL_SEQUENCES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own email sequences" ON public.email_sequences;
DROP POLICY IF EXISTS "Users can insert their own email sequences" ON public.email_sequences;
DROP POLICY IF EXISTS "Users can update their own email sequences" ON public.email_sequences;
DROP POLICY IF EXISTS "Service role can manage email sequences" ON public.email_sequences;

CREATE POLICY "email_sequences_select_policy" ON public.email_sequences FOR SELECT
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "email_sequences_insert_policy" ON public.email_sequences FOR INSERT
WITH CHECK (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "email_sequences_update_policy" ON public.email_sequences FOR UPDATE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

-- ============================================================================
-- SCHEDULED_EMAILS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own scheduled emails" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Users can insert their own scheduled emails" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Users can update their own scheduled emails" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Users can delete their own scheduled emails" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Service role can manage scheduled emails" ON public.scheduled_emails;

CREATE POLICY "scheduled_emails_select_policy" ON public.scheduled_emails FOR SELECT
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "scheduled_emails_insert_policy" ON public.scheduled_emails FOR INSERT
WITH CHECK (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "scheduled_emails_update_policy" ON public.scheduled_emails FOR UPDATE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "scheduled_emails_delete_policy" ON public.scheduled_emails FOR DELETE
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

-- ============================================================================
-- MAPS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own maps" ON public.maps;
DROP POLICY IF EXISTS "Users can create maps" ON public.maps;
DROP POLICY IF EXISTS "Users can update their own maps" ON public.maps;
DROP POLICY IF EXISTS "Users can delete their own maps" ON public.maps;
DROP POLICY IF EXISTS "Allow all on maps" ON public.maps;

CREATE POLICY "maps_select_policy" ON public.maps FOR SELECT
USING (
  user_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "maps_insert_policy" ON public.maps FOR INSERT
WITH CHECK (
  user_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "maps_update_policy" ON public.maps FOR UPDATE
USING (
  user_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "maps_delete_policy" ON public.maps FOR DELETE
USING (
  user_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

-- ============================================================================
-- EXPIRATION_REMINDERS_SENT TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own expiration reminders sent" ON public.expiration_reminders_sent;
DROP POLICY IF EXISTS "Users can insert their own expiration reminders sent" ON public.expiration_reminders_sent;
DROP POLICY IF EXISTS "Service role can manage all expiration reminders" ON public.expiration_reminders_sent;

CREATE POLICY "expiration_reminders_sent_select_policy" ON public.expiration_reminders_sent FOR SELECT
USING (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "expiration_reminders_sent_insert_policy" ON public.expiration_reminders_sent FOR INSERT
WITH CHECK (
  organization_id = (select auth.uid()::text)
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "expiration_reminders_sent_all_policy" ON public.expiration_reminders_sent FOR ALL
USING ((select auth.jwt() ->> 'role') = 'service_role');

-- ============================================================================
-- USER_PROFILES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

CREATE POLICY "user_profiles_select_policy" ON public.user_profiles FOR SELECT
USING (
  id = (select auth.uid())
  OR (select auth.jwt() ->> 'role') = 'service_role'
  OR (select auth.jwt() ->> 'is_admin')::boolean = true
);

CREATE POLICY "user_profiles_update_policy" ON public.user_profiles FOR UPDATE
USING (
  id = (select auth.uid())
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles FOR INSERT
WITH CHECK ((select auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles FOR DELETE
USING ((select auth.jwt() ->> 'role') = 'service_role');

-- ============================================================================
-- USER TABLE (Better Auth)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own user record" ON public."user";
DROP POLICY IF EXISTS "Users can update their own user record" ON public."user";
DROP POLICY IF EXISTS "Service role can manage all users" ON public."user";

CREATE POLICY "user_select_policy" ON public."user" FOR SELECT
USING (
  id = (select auth.uid()::text)
  OR id::uuid = (select auth.uid())
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "user_update_policy" ON public."user" FOR UPDATE
USING (
  id = (select auth.uid()::text)
  OR id::uuid = (select auth.uid())
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "user_all_policy" ON public."user" FOR ALL
USING ((select auth.jwt() ->> 'role') = 'service_role');

-- ============================================================================
-- SESSION TABLE (Better Auth)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.session;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.session;
DROP POLICY IF EXISTS "Service role can manage all sessions" ON public.session;

CREATE POLICY "session_select_policy" ON public.session FOR SELECT
USING (
  user_id = (select auth.uid()::text)
  OR user_id::uuid = (select auth.uid())
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "session_delete_policy" ON public.session FOR DELETE
USING (
  user_id = (select auth.uid()::text)
  OR user_id::uuid = (select auth.uid())
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "session_all_policy" ON public.session FOR ALL
USING ((select auth.jwt() ->> 'role') = 'service_role');

-- ============================================================================
-- ACCOUNT TABLE (Better Auth)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.account;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.account;
DROP POLICY IF EXISTS "Service role can manage all accounts" ON public.account;

CREATE POLICY "account_select_policy" ON public.account FOR SELECT
USING (
  user_id = (select auth.uid()::text)
  OR user_id::uuid = (select auth.uid())
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "account_delete_policy" ON public.account FOR DELETE
USING (
  user_id = (select auth.uid()::text)
  OR user_id::uuid = (select auth.uid())
  OR (select auth.jwt() ->> 'role') = 'service_role'
);

CREATE POLICY "account_all_policy" ON public.account FOR ALL
USING ((select auth.jwt() ->> 'role') = 'service_role');

-- ============================================================================
-- VERIFICATION TABLE (Better Auth)
-- ============================================================================
DROP POLICY IF EXISTS "Service role can manage verifications" ON public.verification;

CREATE POLICY "verification_all_policy" ON public.verification FOR ALL
USING ((select auth.jwt() ->> 'role') = 'service_role');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Changes made:
-- 1. Wrapped all auth.uid() calls in (select auth.uid()) for query plan caching
-- 2. Wrapped all auth.jwt() calls in (select auth.jwt()) for query plan caching
-- 3. Consolidated multiple permissive policies into single policies per action
-- 4. Removed duplicate policies that had same effect
-- ============================================================================
