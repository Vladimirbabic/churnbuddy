-- Add step toggle columns to cancel_flows table
-- Migration: 20251203230000_add_step_toggles

-- Add show_feedback column (default true - show feedback survey)
ALTER TABLE cancel_flows
ADD COLUMN IF NOT EXISTS show_feedback BOOLEAN NOT NULL DEFAULT TRUE;

-- Add show_plans column (default true - show alternative plans)
ALTER TABLE cancel_flows
ADD COLUMN IF NOT EXISTS show_plans BOOLEAN NOT NULL DEFAULT TRUE;

-- Add show_offer column (default true - show special offer)
ALTER TABLE cancel_flows
ADD COLUMN IF NOT EXISTS show_offer BOOLEAN NOT NULL DEFAULT TRUE;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
