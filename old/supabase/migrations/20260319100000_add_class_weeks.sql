-- Add weeks column to classes table for monthly/weekly structure
-- Each week can have its own zoom_link, recording_url, and materials
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'classes' AND column_name = 'weeks'
    ) THEN
        ALTER TABLE classes ADD COLUMN weeks jsonb DEFAULT '[]';
    END IF;
END $$;
