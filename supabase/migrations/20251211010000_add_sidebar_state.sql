-- Add sidebar state column to settings table
-- Values: 'expanded', 'collapsed' - defaults to 'expanded'

ALTER TABLE settings ADD COLUMN IF NOT EXISTS sidebar_state TEXT DEFAULT 'expanded';

-- Add check constraint for valid sidebar state values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'settings_sidebar_state_check'
  ) THEN
    ALTER TABLE settings ADD CONSTRAINT settings_sidebar_state_check
      CHECK (sidebar_state IN ('expanded', 'collapsed'));
  END IF;
END $$;

-- Update any NULL values to 'expanded'
UPDATE settings SET sidebar_state = 'expanded' WHERE sidebar_state IS NULL;
