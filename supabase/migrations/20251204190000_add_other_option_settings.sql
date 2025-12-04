-- Add allow_other_option column to cancel_flows table
-- This allows users to toggle whether the "Other" feedback option with text input is shown

ALTER TABLE cancel_flows
ADD COLUMN IF NOT EXISTS allow_other_option BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN cancel_flows.allow_other_option IS 'Whether to show the "Other" option with text input in feedback survey';
