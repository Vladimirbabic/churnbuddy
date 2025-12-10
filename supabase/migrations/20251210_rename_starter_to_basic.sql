-- Rename 'starter' plan to 'basic'
-- Migration: 20251210_rename_starter_to_basic

-- Rename enum value from 'starter' to 'basic'
ALTER TYPE subscription_plan RENAME VALUE 'starter' TO 'basic';

-- Update default value for plan column
ALTER TABLE subscriptions ALTER COLUMN plan SET DEFAULT 'basic';
