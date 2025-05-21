-- Check if the notes table has 'auto_delete' column and rename it if needed
DO $$
BEGIN
    -- Check if auto_delete exists but autoDelete doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' AND column_name = 'auto_delete'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' AND column_name = 'autoDelete'
    ) THEN
        -- Create the autoDelete column as a copy of auto_delete
        ALTER TABLE notes ADD COLUMN "autoDelete" BOOLEAN DEFAULT TRUE;
        UPDATE notes SET "autoDelete" = auto_delete;
    END IF;

    -- Check if we don't have auto_delete at all
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' AND column_name = 'auto_delete'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' AND column_name = 'autoDelete'
    ) THEN
        -- Add the column with the JavaScript-friendly name
        ALTER TABLE notes ADD COLUMN "autoDelete" BOOLEAN DEFAULT TRUE;
    END IF;
END $$; 