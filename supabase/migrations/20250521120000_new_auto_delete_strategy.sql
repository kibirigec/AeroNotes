-- New Auto-Delete Strategy: Expiry Dates and Scheduled Functions

-- Drop old tables from previous attempts
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS auto_delete_settings CASCADE;

-- Drop old functions from previous attempts
DROP FUNCTION IF EXISTS handle_documents_auto_delete();
DROP FUNCTION IF EXISTS handle_notes_auto_delete();
DROP FUNCTION IF EXISTS handle_images_auto_delete();
DROP FUNCTION IF EXISTS delete_scheduled_items();
DROP FUNCTION IF EXISTS delete_scheduled_documents_and_files(); -- Older version
DROP FUNCTION IF EXISTS set_user_id();
DROP FUNCTION IF EXISTS get_user_timeout(UUID,TEXT);
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the new unified 'files' table
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bucket_id TEXT NOT NULL, -- e.g., 'images', 'aeronotes-documents'
  file_path TEXT NOT NULL, -- Path within the bucket
  file_name TEXT NOT NULL,
  content_type TEXT,
  auto_delete BOOLEAN DEFAULT FALSE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comment for clarity
COMMENT ON COLUMN public.files.file_path IS 'Path of the file within the specified bucket_id.';

-- Enable Row Level Security for the new files table
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Policies for the new files table
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;
CREATE POLICY "Users can view their own files" ON public.files
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
CREATE POLICY "Users can insert their own files" ON public.files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own files" ON public.files;
CREATE POLICY "Users can update their own files" ON public.files
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;
CREATE POLICY "Users can delete their own files" ON public.files
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure storage buckets exist (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('aeronotes-documents', 'aeronotes-documents', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage.objects (ensure these are appropriate for user-specific paths)
-- These allow users to manage files in folders named after their user_id within each bucket.

-- For 'images' bucket
DROP POLICY IF EXISTS "User can manage their own image files" ON storage.objects;
CREATE POLICY "User can manage their own image files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- For 'aeronotes-documents' bucket
DROP POLICY IF EXISTS "User can manage their own document files" ON storage.objects;
CREATE POLICY "User can manage their own document files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'aeronotes-documents' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'aeronotes-documents' AND auth.uid()::text = (storage.foldername(name))[1]);


-- Function to delete expired files from storage and the database table
CREATE OR REPLACE FUNCTION delete_expired_files()
RETURNS void AS $$
DECLARE
  expired_file RECORD;
BEGIN
  FOR expired_file IN
    SELECT id, bucket_id, file_path FROM public.files 
    WHERE auto_delete = true AND expiry_date IS NOT NULL AND expiry_date < NOW()
  LOOP
    -- Attempt to delete from Supabase Storage
    BEGIN
      PERFORM storage.delete_object(expired_file.bucket_id, expired_file.file_path);
      RAISE LOG 'Successfully deleted from storage: %/%', expired_file.bucket_id, expired_file.file_path;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not delete from storage: %/%. Error: %', expired_file.bucket_id, expired_file.file_path, SQLERRM;
        -- Optionally, you might choose not to delete the DB record if storage deletion fails,
        -- or add more sophisticated retry/error logging.
    END;
    
    -- Delete record from the database files table
    DELETE FROM public.files WHERE id = expired_file.id;
    RAISE LOG 'Successfully deleted DB record for: %/%', expired_file.bucket_id, expired_file.file_path;

  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER might be needed if pg_cron runs as a less privileged user

-- Schedule the cron job to run daily at midnight UTC
-- Ensure pg_cron is enabled on your Supabase instance.
-- You might need to run this part manually in the Supabase SQL editor if it fails during migration push
-- or if you want to adjust the schedule.
SELECT cron.schedule(
  'daily-expired-file-deletion', -- Name of the cron job (must be unique)
  '0 0 * * *',  -- Run daily at midnight (UTC)
  $$SELECT delete_expired_files()$$ -- SQL to execute
);

-- Example of how to unschedule (if needed):
-- SELECT cron.unschedule('daily-expired-file-deletion');

-- Function to update timestamp on row update
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update 'updated_at' on files table modification
DROP TRIGGER IF EXISTS on_files_update ON public.files;
CREATE TRIGGER on_files_update
  BEFORE UPDATE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- Note: If you have existing files in storage that you want to manage with this new system,
-- you would need to manually populate the 'files' table with their metadata. 