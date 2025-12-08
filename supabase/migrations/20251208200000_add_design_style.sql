-- Add design_style column to cancel_flows table
-- This stores the design style number (1-9) for the cancel flow modal

ALTER TABLE cancel_flows
ADD COLUMN IF NOT EXISTS design_style integer DEFAULT 1;

-- Update existing rows to have the default design style
UPDATE cancel_flows SET design_style = 1 WHERE design_style IS NULL;
