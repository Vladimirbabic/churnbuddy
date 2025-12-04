-- Add copy, color, and countdown settings to cancel_flows table
-- Migration: 20251204_add_copy_and_color_settings

-- Copy settings for each step (JSONB with title and subtitle)
ALTER TABLE cancel_flows
ADD COLUMN IF NOT EXISTS feedback_copy JSONB DEFAULT '{"title": "Sorry to see you go.", "subtitle": "Please be honest about why you''re leaving. It''s the only way we can improve."}'::jsonb;

ALTER TABLE cancel_flows
ADD COLUMN IF NOT EXISTS plans_copy JSONB DEFAULT '{"title": "How about 80% off of one of our other plans? These aren''t public.", "subtitle": "You''d keep all your history and settings and enjoy much of the same functionality at a lower rate."}'::jsonb;

ALTER TABLE cancel_flows
ADD COLUMN IF NOT EXISTS offer_copy JSONB DEFAULT '{"title": "Stay to get {discount}% off for {duration}. We''d hate to lose you.", "subtitle": "You''re eligible for our special discount."}'::jsonb;

-- Color settings for each step (JSONB with primary, background, text)
ALTER TABLE cancel_flows
ADD COLUMN IF NOT EXISTS feedback_colors JSONB DEFAULT '{"primary": "#9333EA", "background": "#F5F3FF", "text": "#1F2937"}'::jsonb;

ALTER TABLE cancel_flows
ADD COLUMN IF NOT EXISTS plans_colors JSONB DEFAULT '{"primary": "#2563EB", "background": "#F0F4FF", "text": "#1F2937"}'::jsonb;

ALTER TABLE cancel_flows
ADD COLUMN IF NOT EXISTS offer_colors JSONB DEFAULT '{"primary": "#DC2626", "background": "#FEF2F2", "text": "#1F2937"}'::jsonb;

-- Countdown timer settings
ALTER TABLE cancel_flows
ADD COLUMN IF NOT EXISTS show_countdown BOOLEAN DEFAULT true;

ALTER TABLE cancel_flows
ADD COLUMN IF NOT EXISTS countdown_minutes INTEGER DEFAULT 10;

-- Add comments
COMMENT ON COLUMN cancel_flows.feedback_copy IS 'Title and subtitle copy for the feedback survey step';
COMMENT ON COLUMN cancel_flows.plans_copy IS 'Title and subtitle copy for the alternative plans step';
COMMENT ON COLUMN cancel_flows.offer_copy IS 'Title and subtitle copy for the special offer step (supports {discount} and {duration} placeholders)';
COMMENT ON COLUMN cancel_flows.feedback_colors IS 'Color settings (primary, background, text) for the feedback survey step';
COMMENT ON COLUMN cancel_flows.plans_colors IS 'Color settings (primary, background, text) for the alternative plans step';
COMMENT ON COLUMN cancel_flows.offer_colors IS 'Color settings (primary, background, text) for the special offer step';
COMMENT ON COLUMN cancel_flows.show_countdown IS 'Whether to show countdown timer on the special offer';
COMMENT ON COLUMN cancel_flows.countdown_minutes IS 'Duration in minutes for the countdown timer';

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
