-- Email Sequences and Enhanced Templates
-- Migration: 20251205_email_sequences

-- Drop and recreate enum type with new values
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'dunning_1';
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'dunning_2';
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'dunning_3';
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'dunning_4';
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'cancel_save_1';
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'cancel_save_2';
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'cancel_goodbye';
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'winback_1';
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'winback_2';
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'winback_3';

-- Create email_sequences table for timing configuration
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,

  -- Dunning sequence (days after payment failure)
  dunning_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  dunning_1_days INTEGER NOT NULL DEFAULT 0,  -- Immediately
  dunning_2_days INTEGER NOT NULL DEFAULT 3,
  dunning_3_days INTEGER NOT NULL DEFAULT 7,
  dunning_4_days INTEGER NOT NULL DEFAULT 10,

  -- Cancel flow save sequence (days after cancel flow started but not completed)
  cancel_save_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  cancel_save_1_days INTEGER NOT NULL DEFAULT 1,  -- 1 day after abandoning cancel flow
  cancel_save_2_days INTEGER NOT NULL DEFAULT 3,

  -- Win-back sequence (days after cancellation)
  winback_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  winback_1_days INTEGER NOT NULL DEFAULT 14,
  winback_2_days INTEGER NOT NULL DEFAULT 30,
  winback_3_days INTEGER NOT NULL DEFAULT 60,

  -- Goodbye email (sent immediately on cancellation)
  goodbye_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_sequences_org ON email_sequences(organization_id);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_email_sequences_updated_at ON email_sequences;
CREATE TRIGGER update_email_sequences_updated_at
  BEFORE UPDATE ON email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_sequences
CREATE POLICY "Users can view their own email sequences"
  ON email_sequences FOR SELECT
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Users can insert their own email sequences"
  ON email_sequences FOR INSERT
  WITH CHECK (auth.uid()::text = organization_id);

CREATE POLICY "Users can update their own email sequences"
  ON email_sequences FOR UPDATE
  USING (auth.uid()::text = organization_id);

-- Create scheduled_emails table to track pending emails
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,

  -- Email details
  template_type TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,

  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- Context data (JSON for template variables)
  context JSONB NOT NULL DEFAULT '{}',

  -- Related records
  subscription_id TEXT,
  invoice_id TEXT,
  cancel_flow_id UUID,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  error_message TEXT,
  resend_message_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for scheduled_emails
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_org ON scheduled_emails(organization_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON scheduled_emails(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_customer ON scheduled_emails(customer_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_pending ON scheduled_emails(organization_id, status, scheduled_for)
  WHERE status = 'pending';

-- Create updated_at trigger for scheduled_emails
DROP TRIGGER IF EXISTS update_scheduled_emails_updated_at ON scheduled_emails;
CREATE TRIGGER update_scheduled_emails_updated_at
  BEFORE UPDATE ON scheduled_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_emails
CREATE POLICY "Users can view their own scheduled emails"
  ON scheduled_emails FOR SELECT
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Users can insert their own scheduled emails"
  ON scheduled_emails FOR INSERT
  WITH CHECK (auth.uid()::text = organization_id);

CREATE POLICY "Users can update their own scheduled emails"
  ON scheduled_emails FOR UPDATE
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Users can delete their own scheduled emails"
  ON scheduled_emails FOR DELETE
  USING (auth.uid()::text = organization_id);

-- Add sequence_position to email_templates for ordering
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS sequence_position INTEGER DEFAULT 1;

-- Create email_sends table to track sent emails (for analytics)
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,

  -- Email details
  template_type TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  customer_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,

  -- Tracking
  resend_message_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Related records
  subscription_id TEXT,
  invoice_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for email_sends
CREATE INDEX IF NOT EXISTS idx_email_sends_org ON email_sends(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_customer ON email_sends(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_template ON email_sends(template_type);
CREATE INDEX IF NOT EXISTS idx_email_sends_sent_at ON email_sends(organization_id, sent_at DESC);

-- Enable Row Level Security
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_sends
CREATE POLICY "Users can view their own email sends"
  ON email_sends FOR SELECT
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Users can insert their own email sends"
  ON email_sends FOR INSERT
  WITH CHECK (auth.uid()::text = organization_id);
