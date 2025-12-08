-- Expiration Reminder Emails
-- Migration: 20251208_expiration_reminders
-- Adds support for sending reminder emails before subscription expiration

-- Add new email template types for expiration reminders
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'expiration_reminder_30';
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'expiration_reminder_14';
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'expiration_reminder_7';
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'expiration_reminder_3';
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'expiration_reminder_1';

-- Add expiration reminder settings to email_sequences table
ALTER TABLE email_sequences
  ADD COLUMN IF NOT EXISTS expiration_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS expiration_reminder_30_days BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS expiration_reminder_14_days BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS expiration_reminder_7_days BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS expiration_reminder_3_days BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS expiration_reminder_1_days BOOLEAN NOT NULL DEFAULT TRUE;

-- Create table to track which expiration reminders have been sent
-- This prevents duplicate reminders from being sent
CREATE TABLE IF NOT EXISTS expiration_reminders_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('30_days', '14_days', '7_days', '3_days', '1_day')),
  current_period_end TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate reminders for the same period
  UNIQUE(subscription_id, reminder_type, current_period_end)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expiration_reminders_sent_org ON expiration_reminders_sent(organization_id);
CREATE INDEX IF NOT EXISTS idx_expiration_reminders_sent_customer ON expiration_reminders_sent(customer_id);
CREATE INDEX IF NOT EXISTS idx_expiration_reminders_sent_subscription ON expiration_reminders_sent(subscription_id);
CREATE INDEX IF NOT EXISTS idx_expiration_reminders_sent_lookup ON expiration_reminders_sent(subscription_id, reminder_type, current_period_end);

-- Enable Row Level Security
ALTER TABLE expiration_reminders_sent ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own expiration reminders sent"
  ON expiration_reminders_sent FOR SELECT
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Users can insert their own expiration reminders sent"
  ON expiration_reminders_sent FOR INSERT
  WITH CHECK (auth.uid()::text = organization_id);

-- Service role policy for cron jobs
CREATE POLICY "Service role can manage all expiration reminders"
  ON expiration_reminders_sent FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment to table
COMMENT ON TABLE expiration_reminders_sent IS 'Tracks which expiration reminder emails have been sent to prevent duplicates';
