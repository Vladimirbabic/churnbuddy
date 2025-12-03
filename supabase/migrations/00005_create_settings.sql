-- Settings table for organization configuration
-- Migration: 00005_create_settings

-- Create enum types
CREATE TYPE email_provider AS ENUM ('resend', 'sendgrid', 'smtp');
CREATE TYPE dunning_urgency AS ENUM ('low', 'medium', 'high');

-- Create settings table
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT UNIQUE NOT NULL,

  -- Onboarding
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_step INTEGER NOT NULL DEFAULT 0,

  -- Stripe Configuration (store encrypted in production)
  stripe_config JSONB NOT NULL DEFAULT '{
    "secret_key": null,
    "webhook_secret": null,
    "publishable_key": null,
    "is_connected": false,
    "test_mode": true
  }'::jsonb,

  -- Email Configuration
  email_config JSONB NOT NULL DEFAULT '{
    "provider": "resend",
    "api_key": null,
    "from_email": null,
    "from_name": null,
    "reply_to": null,
    "is_connected": false
  }'::jsonb,

  -- Cancel Flow Settings
  cancel_flow_config JSONB NOT NULL DEFAULT '{
    "enabled": true,
    "discount_percent": 20,
    "discount_duration": 3,
    "show_survey": true,
    "custom_reasons": [],
    "success_message": "Thank you for your feedback!",
    "company_name": null
  }'::jsonb,

  -- Dunning Settings
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

  -- Branding
  branding JSONB NOT NULL DEFAULT '{
    "logo_url": null,
    "primary_color": "#6366f1",
    "company_name": null
  }'::jsonb,

  -- Notifications
  notifications JSONB NOT NULL DEFAULT '{
    "email_on_failed_payment": true,
    "email_on_cancellation": true,
    "email_on_recovery": true,
    "slack_webhook_url": null
  }'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_settings_organization_id ON settings(organization_id);

-- Create updated_at trigger
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own settings"
  ON settings FOR SELECT
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Users can insert their own settings"
  ON settings FOR INSERT
  WITH CHECK (auth.uid()::text = organization_id);

CREATE POLICY "Users can update their own settings"
  ON settings FOR UPDATE
  USING (auth.uid()::text = organization_id);

-- Function to initialize settings for new user
CREATE OR REPLACE FUNCTION initialize_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default settings
  INSERT INTO settings (organization_id)
  VALUES (NEW.id::text)
  ON CONFLICT (organization_id) DO NOTHING;

  -- Create default email templates
  PERFORM create_default_email_templates(NEW.id::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create settings when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_settings();
