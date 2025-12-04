-- Add flow_id column to churn_events for tracking which cancel flow was used
-- Also add 'feedback_submitted' to event type enum

-- Add flow_id column
ALTER TABLE churn_events ADD COLUMN IF NOT EXISTS flow_id UUID;

-- Create index for flow_id
CREATE INDEX IF NOT EXISTS idx_churn_events_flow_id ON churn_events(flow_id);

-- Add feedback_submitted to event type if not exists
-- (PostgreSQL doesn't have IF NOT EXISTS for enum values, so we use a DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'feedback_submitted' AND enumtypid = 'churn_event_type'::regtype) THEN
    ALTER TYPE churn_event_type ADD VALUE 'feedback_submitted';
  END IF;
END$$;
