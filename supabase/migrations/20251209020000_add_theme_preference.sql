-- Add theme preference column to settings table
-- Values: 'light', 'dark', 'system' - defaults to 'light'

ALTER TABLE settings ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light';

-- Add check constraint for valid theme values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'settings_theme_check'
  ) THEN
    ALTER TABLE settings ADD CONSTRAINT settings_theme_check
      CHECK (theme IN ('light', 'dark', 'system'));
  END IF;
END $$;

-- Update any NULL values to 'light'
UPDATE settings SET theme = 'light' WHERE theme IS NULL;
