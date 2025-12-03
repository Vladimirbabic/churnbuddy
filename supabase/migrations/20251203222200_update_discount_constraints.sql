-- Update discount_percent constraint to allow higher values
-- Migration: 20251203222200_update_discount_constraints

-- Drop the existing constraint and add a new one with wider range
ALTER TABLE cancel_flows
DROP CONSTRAINT IF EXISTS cancel_flows_discount_percent_check;

ALTER TABLE cancel_flows
ADD CONSTRAINT cancel_flows_discount_percent_check
CHECK (discount_percent >= 5 AND discount_percent <= 90);
