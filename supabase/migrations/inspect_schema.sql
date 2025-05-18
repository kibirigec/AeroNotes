-- Inspect the notes table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'notes'
ORDER BY ordinal_position; 