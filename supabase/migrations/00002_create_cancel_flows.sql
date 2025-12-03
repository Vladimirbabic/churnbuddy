-- Cancel Flows table for storing cancel flow configurations
-- Migration: 00002_create_cancel_flows

-- Create enum types
CREATE TYPE cancel_flow_target_type AS ENUM ('all', 'product', 'plan', 'custom');
CREATE TYPE cancel_flow_theme AS ENUM ('minimal', 'gradient', 'soft', 'bold', 'glass', 'dark');

-- Create cancel_flows table
CREATE TABLE cancel_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,

  -- Targeting
  target_type cancel_flow_target_type NOT NULL DEFAULT 'all',
  target_product_ids TEXT[] DEFAULT '{}',
  target_plan_ids TEXT[] DEFAULT '{}',
  target_customer_segment TEXT,

  -- Appearance
  theme cancel_flow_theme NOT NULL DEFAULT 'minimal',

  -- Content
  header_title TEXT NOT NULL DEFAULT 'We''re sorry to see you go',
  header_description TEXT DEFAULT 'Before you cancel, would you mind telling us why?',
  offer_title TEXT DEFAULT 'Wait! How about a special offer?',
  offer_description TEXT DEFAULT 'We''d hate to lose you. Here''s a discount to stay.',

  -- Cancellation reasons (stored as JSONB array)
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

  -- Offer settings
  discount_percent INTEGER NOT NULL DEFAULT 20 CHECK (discount_percent >= 5 AND discount_percent <= 50),
  discount_duration INTEGER NOT NULL DEFAULT 3 CHECK (discount_duration >= 1 AND discount_duration <= 12),
  show_offer BOOLEAN NOT NULL DEFAULT TRUE,

  -- Analytics
  impressions INTEGER NOT NULL DEFAULT 0,
  cancellations INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_cancel_flows_organization_id ON cancel_flows(organization_id);
CREATE INDEX idx_cancel_flows_org_active ON cancel_flows(organization_id, is_active);
CREATE INDEX idx_cancel_flows_org_default ON cancel_flows(organization_id, is_default);

-- Create updated_at trigger
CREATE TRIGGER update_cancel_flows_updated_at
  BEFORE UPDATE ON cancel_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE cancel_flows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own cancel flows"
  ON cancel_flows FOR SELECT
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Users can insert their own cancel flows"
  ON cancel_flows FOR INSERT
  WITH CHECK (auth.uid()::text = organization_id);

CREATE POLICY "Users can update their own cancel flows"
  ON cancel_flows FOR UPDATE
  USING (auth.uid()::text = organization_id);

CREATE POLICY "Users can delete their own cancel flows"
  ON cancel_flows FOR DELETE
  USING (auth.uid()::text = organization_id);
