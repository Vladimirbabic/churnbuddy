-- Add email provider settings to subscriptions table (which stores org settings)
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS resend_api_key TEXT,
ADD COLUMN IF NOT EXISTS from_email TEXT,
ADD COLUMN IF NOT EXISTS from_name TEXT,
ADD COLUMN IF NOT EXISTS email_provider_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_provider_connected_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.resend_api_key IS 'Customer''s Resend API key for sending emails from their domain';
COMMENT ON COLUMN subscriptions.from_email IS 'Email address to send from (must be verified in Resend)';
COMMENT ON COLUMN subscriptions.from_name IS 'Display name for sent emails';
COMMENT ON COLUMN subscriptions.email_provider_connected IS 'Whether email provider is configured and validated';
COMMENT ON COLUMN subscriptions.email_provider_connected_at IS 'When the email provider was connected';
