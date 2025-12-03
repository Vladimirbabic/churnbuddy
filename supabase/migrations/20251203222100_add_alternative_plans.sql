-- Add alternative_plans column to cancel_flows table
-- Migration: 00006_add_alternative_plans

-- Add the alternative_plans column as JSONB to store plan configurations
ALTER TABLE cancel_flows
ADD COLUMN IF NOT EXISTS alternative_plans JSONB NOT NULL DEFAULT '[
  {
    "id": "basic",
    "name": "Basic",
    "originalPrice": 29,
    "discountedPrice": 5.80,
    "period": "/mo",
    "highlights": ["5 projects", "Basic analytics", "Email support", "1GB storage"]
  },
  {
    "id": "pro",
    "name": "Pro",
    "originalPrice": 79,
    "discountedPrice": 15.80,
    "period": "/mo",
    "highlights": ["25 projects", "Advanced analytics", "Priority support", "10GB storage"]
  }
]'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN cancel_flows.alternative_plans IS 'JSON array of alternative plan options to show during cancel flow';
