-- ============================================================================
-- ChurnBuddy Full Database Schema for Supabase
-- ============================================================================
-- Run this file in the Supabase SQL Editor to set up the complete database
-- ============================================================================

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

-- Subscription enums
CREATE TYPE subscription_plan AS ENUM ('starter', 'growth', 'scale');
CREATE TYPE subscription_status AS ENUM (
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete',
  'incomplete_expired',
  'unpaid'
);

-- Cancel flow enums
CREATE TYPE cancel_flow_target_type AS ENUM ('all', 'product', 'plan', 'custom');
CREATE TYPE cancel_flow_theme AS ENUM ('minimal', 'gradient', 'soft', 'bold', 'glass', 'dark');

-- Churn event enums
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

-- Email template enums
CREATE TYPE email_template_type AS ENUM (
  'payment_failed',
  'payment_reminder',
  'subscription_canceled',
  'offer_accepted',
  'custom'
);

-- Settings enums
CREATE TYPE email_provider AS ENUM ('resend', 'sendgrid', 'smtp');
CREATE TYPE dunning_urgency AS ENUM ('low', 'medium', 'high');

-- ============================================================================
-- 2. HELPER FUNCTIONS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan subscription_plan NOT NULL DEFAULT 'starter',
  status subscription_status NOT NULL DEFAULT 'incomplete',
  cancel_flows_limit INTEGER NOT NULL DEFAULT 1,
  cancel_flows_used INTEGER NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Users can update their own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 4. CANCEL FLOWS TABLE
-- ============================================================================

CREATE TABLE cancel_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  target_type cancel_flow_target_type NOT NULL DEFAULT 'all',
  target_product_ids TEXT[] DEFAULT '{}',
  target_plan_ids TEXT[] DEFAULT '{}',
  target_customer_segment TEXT,
  theme cancel_flow_theme NOT NULL DEFAULT 'minimal',
  header_title TEXT NOT NULL DEFAULT 'We''re sorry to see you go',
  header_description TEXT DEFAULT 'Before you cancel, would you mind telling us why?',
  offer_title TEXT DEFAULT 'Wait! How about a special offer?',
  offer_description TEXT DEFAULT 'We''d hate to lose you. Here''s a discount to stay.',
  reasons JSONB NOT NULL DEFAULT '[
    {"id": "too_expensive", "label": "Too expensive"},
    {"id": "not_using", "label": "Not using it enough"},
    {"id": "missing_features", "label": "Missing features I need"},
    {"id": "found_alternative", "label": "Found an alternative"},
    {"id": "technical_issues", "label": "Technical issues"},
    {"id": "poor_support", "label": "Poor customer support"},
    {"id": "temporary", "label": "Just need a break"},
    {"id": "other", "label": "Other"}
  ]'::jsonb,
  discount_percent INTEGER NOT NULL DEFAULT 20 CHECK (discount_percent >= 5 AND discount_percent <= 50),
  discount_duration INTEGER NOT NULL DEFAULT 3 CHECK (discount_duration >= 1 AND discount_duration <= 12),
  show_offer BOOLEAN NOT NULL DEFAULT TRUE,
  impressions INTEGER NOT NULL DEFAULT 0,
  cancellations INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cancel_flows_organization_id ON cancel_flows(organization_id);
CREATE INDEX idx_cancel_flows_org_active ON cancel_flows(organization_id, is_active);
CREATE INDEX idx_cancel_flows_org_default ON cancel_flows(organization_id, is_default);

CREATE TRIGGER update_cancel_flows_updated_at
  BEFORE UPDATE ON cancel_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE cancel_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cancel flows"
  ON cancel_flows FOR ALL
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Service role can manage cancel flows"
  ON cancel_flows FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 5. CHURN EVENTS TABLE
-- ============================================================================

CREATE TABLE churn_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  event_type churn_event_type NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_id TEXT NOT NULL,
  customer_email TEXT,
  subscription_id TEXT,
  invoice_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  source churn_event_source NOT NULL DEFAULT 'api',
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_churn_events_organization_id ON churn_events(organization_id);
CREATE INDEX idx_churn_events_event_type ON churn_events(event_type);
CREATE INDEX idx_churn_events_timestamp ON churn_events(timestamp DESC);
CREATE INDEX idx_churn_events_customer_id ON churn_events(customer_id);
CREATE INDEX idx_churn_events_customer_email ON churn_events(customer_email);
CREATE INDEX idx_churn_events_subscription_id ON churn_events(subscription_id);
CREATE INDEX idx_churn_events_type_timestamp ON churn_events(event_type, timestamp DESC);
CREATE INDEX idx_churn_events_customer_timestamp ON churn_events(customer_id, timestamp DESC);
CREATE INDEX idx_churn_events_org_timestamp ON churn_events(organization_id, timestamp DESC);
CREATE INDEX idx_churn_events_invoice_id ON churn_events(invoice_id) WHERE invoice_id IS NOT NULL;

ALTER TABLE churn_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own churn events"
  ON churn_events FOR ALL
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Service role can manage churn events"
  ON churn_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Metrics aggregation function
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

-- ============================================================================
-- 6. EMAIL TEMPLATES TABLE
-- ============================================================================

CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  type email_template_type NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  variables TEXT[] DEFAULT ARRAY[
    '{{customer_name}}',
    '{{amount}}',
    '{{company_name}}',
    '{{update_payment_link}}',
    '{{days_remaining}}',
    '{{discount_percent}}',
    '{{discount_duration}}',
    '{{end_date}}'
  ],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_templates_organization_id ON email_templates(organization_id);
CREATE INDEX idx_email_templates_org_type ON email_templates(organization_id, type);
CREATE INDEX idx_email_templates_org_active ON email_templates(organization_id, is_active);

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own email templates"
  ON email_templates FOR ALL
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Service role can manage email templates"
  ON email_templates FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Default templates function
CREATE OR REPLACE FUNCTION create_default_email_templates(p_organization_id TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO email_templates (organization_id, type, name, subject, body) VALUES
  (
    p_organization_id,
    'payment_failed',
    'Payment Failed - First Notice',
    'Action Required: Your payment failed',
    E'Hi {{customer_name}},\n\nWe were unable to process your payment of {{amount}}.\n\nPlease update your payment method to avoid service interruption:\n{{update_payment_link}}\n\nIf you have any questions, please don''t hesitate to reach out.\n\nBest,\n{{company_name}}'
  ),
  (
    p_organization_id,
    'payment_reminder',
    'Payment Reminder - Final Notice',
    'Urgent: Update your payment method',
    E'Hi {{customer_name}},\n\nThis is a final reminder that your payment of {{amount}} is still outstanding.\n\nYour access will be suspended in {{days_remaining}} days unless payment is received.\n\nUpdate payment method: {{update_payment_link}}\n\nBest,\n{{company_name}}'
  ),
  (
    p_organization_id,
    'offer_accepted',
    'Discount Applied Confirmation',
    'Your {{discount_percent}}% discount has been applied!',
    E'Hi {{customer_name}},\n\nGreat news! Your {{discount_percent}}% discount has been applied to your subscription for the next {{discount_duration}} months.\n\nThank you for staying with us!\n\nBest,\n{{company_name}}'
  ),
  (
    p_organization_id,
    'subscription_canceled',
    'Subscription Canceled Confirmation',
    'Your subscription has been canceled',
    E'Hi {{customer_name}},\n\nWe''re sorry to see you go. Your subscription has been canceled and will remain active until {{end_date}}.\n\nIf you change your mind, you can resubscribe at any time.\n\nBest,\n{{company_name}}'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. SETTINGS TABLE
-- ============================================================================

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT UNIQUE NOT NULL,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_step INTEGER NOT NULL DEFAULT 0,
  stripe_config JSONB NOT NULL DEFAULT '{
    "secret_key": null,
    "webhook_secret": null,
    "publishable_key": null,
    "is_connected": false,
    "test_mode": true
  }'::jsonb,
  email_config JSONB NOT NULL DEFAULT '{
    "provider": "resend",
    "api_key": null,
    "from_email": null,
    "from_name": null,
    "reply_to": null,
    "is_connected": false
  }'::jsonb,
  cancel_flow_config JSONB NOT NULL DEFAULT '{
    "enabled": true,
    "discount_percent": 20,
    "discount_duration": 3,
    "show_survey": true,
    "custom_reasons": [],
    "success_message": "Thank you for your feedback!",
    "company_name": null
  }'::jsonb,
  dunning_config JSONB NOT NULL DEFAULT '{
    "enabled": true,
    "email_sequence": [
      {"day": 1, "subject": "Payment failed - please update", "urgency_level": "low"},
      {"day": 3, "subject": "Reminder: Payment still needed", "urgency_level": "medium"},
      {"day": 7, "subject": "Final notice: Action required", "urgency_level": "high"}
    ],
    "max_attempts": 3,
    "include_billing_portal_link": true
  }'::jsonb,
  branding JSONB NOT NULL DEFAULT '{
    "logo_url": null,
    "primary_color": "#6366f1",
    "company_name": null
  }'::jsonb,
  notifications JSONB NOT NULL DEFAULT '{
    "email_on_failed_payment": true,
    "email_on_cancellation": true,
    "email_on_recovery": true,
    "slack_webhook_url": null
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settings_organization_id ON settings(organization_id);

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON settings FOR ALL
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Service role can manage settings"
  ON settings FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 8. AUTO-INITIALIZE USER DATA ON SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default settings
  INSERT INTO settings (organization_id)
  VALUES (NEW.id::text)
  ON CONFLICT (organization_id) DO NOTHING;

  -- Create default subscription (starter plan, incomplete status)
  INSERT INTO subscriptions (organization_id, plan, status)
  VALUES (NEW.id::text, 'starter', 'incomplete')
  ON CONFLICT (organization_id) DO NOTHING;

  -- Create default email templates
  PERFORM create_default_email_templates(NEW.id::text);

  -- Create default cancel flow
  INSERT INTO cancel_flows (organization_id, name, is_default)
  VALUES (NEW.id::text, 'Default Cancel Flow', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_data();

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Your ChurnBuddy database is now ready.
--
-- Next steps:
-- 1. Update your .env.local with Supabase credentials
-- 2. Update API routes to use Supabase client instead of MongoDB
-- ============================================================================
