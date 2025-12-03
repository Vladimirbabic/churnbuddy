-- Fix discount_percent constraint
-- Migration: 20251203222300_fix_constraints

-- First, drop ALL check constraints on the table and recreate them
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find and drop all check constraints containing 'discount_percent'
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'cancel_flows'::regclass
        AND contype = 'c'
        AND conname LIKE '%discount_percent%'
    ) LOOP
        EXECUTE 'ALTER TABLE cancel_flows DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Add the corrected constraint
ALTER TABLE cancel_flows
ADD CONSTRAINT cancel_flows_discount_percent_check
CHECK (discount_percent >= 5 AND discount_percent <= 90);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
