-- Ensure alternative_plans column exists and reload schema cache
-- Migration: 20251203222400_reload_schema

-- Add column if it doesn't exist (safe to run multiple times)
ALTER TABLE cancel_flows
ADD COLUMN IF NOT EXISTS alternative_plans JSONB NOT NULL DEFAULT '[
  {"id": "basic", "name": "Basic", "originalPrice": 29, "discountedPrice": 5.80, "period": "/mo", "highlights": ["5 projects", "Basic analytics", "Email support", "1GB storage"]},
  {"id": "pro", "name": "Pro", "originalPrice": 79, "discountedPrice": 15.80, "period": "/mo", "highlights": ["25 projects", "Advanced analytics", "Priority support", "10GB storage"]}
]'::jsonb;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
