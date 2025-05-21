-- supabase/migrations/YYYYMMDDHHMMSS_add_expiry_to_notes_and_update_cleanup_function.sql

-- Add expiry_date column to the notes table
ALTER TABLE public.notes
ADD COLUMN expiry_date TIMESTAMPTZ NULL;

-- Add an index to expiry_date for potentially faster queries (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_notes_expiry_date ON public.notes(expiry_date);

-- Drop the existing function to redefine it (or use CREATE OR REPLACE)
DROP FUNCTION IF EXISTS public.delete_expired_files();

-- Recreate the function to handle both 'files' and 'notes' tables
CREATE OR REPLACE FUNCTION public.delete_expired_files()
RETURNS TABLE (deleted_id UUID, table_source TEXT, file_path_or_note_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER -- Important for accessing storage objects if needed later by this function directly
AS $$
DECLARE
    file_record RECORD;
    note_record RECORD;
    deleted_count INTEGER := 0;
    bucket_name TEXT;
    full_path TEXT;
    r RECORD;
BEGIN
    RAISE LOG 'delete_expired_files: Function started at %', NOW();

    -- Delete from public.files (existing logic)
    RAISE LOG 'delete_expired_files: Checking public.files for expired items.';
    FOR file_record IN 
        SELECT id, bucket_id, file_path 
        FROM public.files 
        WHERE auto_delete = TRUE AND expiry_date IS NOT NULL AND expiry_date < NOW()
    LOOP
        RAISE LOG 'delete_expired_files: Attempting to delete file_id: %, bucket_id: %, file_path: % from public.files', file_record.id, file_record.bucket_id, file_record.file_path;
        
        -- Attempt to delete from storage
        BEGIN
            bucket_name := file_record.bucket_id; -- Assuming bucket_id is the name like 'documents' or 'images'
            full_path := file_record.file_path;

            RAISE LOG '%', format('delete_expired_files: Attempting to remove storage object: bucket=%L, path=%L', bucket_name, full_path);
            
            -- Perform the storage deletion
            -- Ensure the role executing this has permissions for storage.objects delete
            -- Note: The storage.delete_object function might be better if it handles non-existent objects gracefully.
            -- The standard supabase_storage_admin role (used by SECURITY DEFINER functions if owned by postgres) should have rights.
            -- If this function is owned by 'postgres' and has SECURITY DEFINER, it runs with 'postgres' rights.
            -- Simpler direct delete:
            DELETE FROM storage.objects WHERE storage.objects.bucket_id = bucket_name AND storage.objects.name = full_path;
                
            RAISE LOG '%', format('delete_expired_files: Successfully removed storage object: bucket=%L, path=%L', bucket_name, full_path);

        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'delete_expired_files: Could not delete storage object for file_id: %. Bucket: %, Path: %. Error: %', file_record.id, bucket_name, full_path, SQLERRM;
                -- Decide if you want to proceed with metadata deletion if storage deletion fails.
                -- For now, we'll log a warning and continue to delete the metadata.
        END;

        -- Delete the metadata from public.files
        DELETE FROM public.files WHERE id = file_record.id;
        RAISE LOG 'delete_expired_files: Deleted metadata for file_id: % from public.files', file_record.id;
        
        deleted_id := file_record.id;
        table_source := 'public.files';
        file_path_or_note_id := file_record.file_path;
        RETURN NEXT;
        deleted_count := deleted_count + 1;
    END LOOP;

    -- Delete from public.notes (new logic)
    RAISE LOG 'delete_expired_files: Checking public.notes for expired items.';
    FOR note_record IN
        SELECT id FROM public.notes
        WHERE "autoDelete" = TRUE AND expiry_date IS NOT NULL AND expiry_date < NOW() -- Note: "autoDelete" is quoted
    LOOP
        RAISE LOG 'delete_expired_files: Attempting to delete note_id: % from public.notes', note_record.id;
        
        DELETE FROM public.notes WHERE id = note_record.id;
        RAISE LOG 'delete_expired_files: Deleted note_id: % from public.notes', note_record.id;
        
        deleted_id := note_record.id;
        table_source := 'public.notes';
        file_path_or_note_id := note_record.id::TEXT; -- Cast UUID to TEXT for the column type
        RETURN NEXT;
        deleted_count := deleted_count + 1;
    END LOOP;

    RAISE LOG 'delete_expired_files: Function completed. Total items processed for deletion: %.', deleted_count;
END;
$$;

-- Example of how to call it (for testing in SQL editor):
-- SELECT * FROM public.delete_expired_files();

-- Grant execute on the function to relevant roles if needed, e.g., authenticated or service_role
-- The cron job will likely run as 'postgres' or a superuser role which owns pg_cron,
-- so it should have execute permissions by default if it owns the function.
-- If cron runs as a different user, grant might be needed:
-- GRANT EXECUTE ON FUNCTION public.delete_expired_files() TO your_cron_runner_role;
-- GRANT EXECUTE ON FUNCTION public.delete_expired_files() TO supabase_admin; -- if cron is run by this role.

COMMENT ON FUNCTION public.delete_expired_files() IS 'Deletes files from public.files and their corresponding storage objects, and notes from public.notes, if they are marked for auto-delete and their expiry_date has passed. Returns a table of deleted item IDs, their source table, and file path or note ID.'; 