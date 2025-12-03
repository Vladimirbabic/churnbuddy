-- Email Templates table for customizable email templates
-- Migration: 00004_create_email_templates

-- Create enum type
CREATE TYPE email_template_type AS ENUM (
  'payment_failed',
  'payment_reminder',
  'subscription_canceled',
  'offer_accepted',
  'custom'
);

-- Create email_templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  type email_template_type NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Available merge tags for this template
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

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_email_templates_organization_id ON email_templates(organization_id);
CREATE INDEX idx_email_templates_org_type ON email_templates(organization_id, type);
CREATE INDEX idx_email_templates_org_active ON email_templates(organization_id, is_active);

-- Create updated_at trigger
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own email templates"
  ON email_templates FOR SELECT
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Users can insert their own email templates"
  ON email_templates FOR INSERT
  WITH CHECK (auth.uid()::text = organization_id);

CREATE POLICY "Users can update their own email templates"
  ON email_templates FOR UPDATE
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Users can delete their own email templates"
  ON email_templates FOR DELETE
  USING (auth.uid()::text = organization_id);

-- Insert default templates function (call after user signs up)
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
