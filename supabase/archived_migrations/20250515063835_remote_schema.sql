-- Reset Database Schema with Improved Auto-Delete Implementation

-- Drop all existing tables (if they exist)
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS auto_delete_settings;

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_documents_auto_delete();
DROP FUNCTION IF EXISTS handle_notes_auto_delete();
DROP FUNCTION IF EXISTS handle_images_auto_delete();
DROP FUNCTION IF EXISTS delete_scheduled_documents_and_files();
DROP FUNCTION IF EXISTS delete_scheduled_items();
DROP FUNCTION IF EXISTS set_user_id();
DROP FUNCTION IF EXISTS get_user_timeout(UUID,TEXT);
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create settings table for global auto-delete configurations
CREATE TABLE IF NOT EXISTS auto_delete_settings (
  id SERIAL PRIMARY KEY, 
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_timeout_seconds INTEGER DEFAULT 86400, -- 24 hours default
  note_timeout_seconds INTEGER DEFAULT 3600, -- 1 hour default
  image_timeout_seconds INTEGER DEFAULT 43200, -- 12 hours default
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id) -- Ensure only one settings row per user
);

-- Create documents table with consistent naming
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  auto_delete BOOLEAN DEFAULT FALSE,
  auto_delete_timeout_seconds INTEGER DEFAULT NULL, -- NULL means use default from settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_edited TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  scheduled_deletion TIMESTAMP WITH TIME ZONE,
  file_path TEXT
);

-- Create notes table with consistent naming
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  auto_delete BOOLEAN DEFAULT TRUE,
  auto_delete_timeout_seconds INTEGER DEFAULT NULL, -- NULL means use default from settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  scheduled_deletion TIMESTAMP WITH TIME ZONE,
  last_edited TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create images table with consistent naming
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  file_name TEXT,
  file_path TEXT NOT NULL,
  auto_delete BOOLEAN DEFAULT FALSE,
  auto_delete_timeout_seconds INTEGER DEFAULT NULL, -- NULL means use default from settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  scheduled_deletion TIMESTAMP WITH TIME ZONE,
  last_edited TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for faster queries
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS images_user_id_idx ON images(user_id);
CREATE INDEX IF NOT EXISTS auto_delete_settings_user_id_idx ON auto_delete_settings(user_id);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_delete_settings ENABLE ROW LEVEL SECURITY;

-- Policies for documents
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own documents" ON documents;
CREATE POLICY "Users can create their own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for notes
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
CREATE POLICY "Users can view their own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own notes" ON notes;
CREATE POLICY "Users can create their own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
CREATE POLICY "Users can update their own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for images
DROP POLICY IF EXISTS "Users can view their own images" ON images;
CREATE POLICY "Users can view their own images" ON images
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own images" ON images;
CREATE POLICY "Users can create their own images" ON images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own images" ON images;
CREATE POLICY "Users can update their own images" ON images
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own images" ON images;
CREATE POLICY "Users can delete their own images" ON images
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for auto_delete_settings
DROP POLICY IF EXISTS "Users can view their own auto-delete settings" ON auto_delete_settings;
CREATE POLICY "Users can view their own auto-delete settings" ON auto_delete_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own auto-delete settings" ON auto_delete_settings;
CREATE POLICY "Users can create their own auto-delete settings" ON auto_delete_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own auto-delete settings" ON auto_delete_settings;
CREATE POLICY "Users can update their own auto-delete settings" ON auto_delete_settings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own auto-delete settings" ON auto_delete_settings;
CREATE POLICY "Users can delete their own auto-delete settings" ON auto_delete_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('aeronotes-documents', 'aeronotes-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for images bucket
DROP POLICY IF EXISTS "Allow users to access their own files" ON storage.objects;
CREATE POLICY "Allow users to access their own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'images' AND
    auth.uid()::text = owner::text
  );

DROP POLICY IF EXISTS "Allow users to upload their own files" ON storage.objects;
CREATE POLICY "Allow users to upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND
    auth.uid()::text = owner::text
  );

DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
CREATE POLICY "Allow users to update their own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'images' AND
    auth.uid()::text = owner::text
  );

DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
CREATE POLICY "Allow users to delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' AND
    auth.uid()::text = owner::text
  );

-- Storage policies for documents bucket
DROP POLICY IF EXISTS "Allow users to access their own documents" ON storage.objects;
CREATE POLICY "Allow users to access their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'aeronotes-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Allow users to upload their own documents" ON storage.objects;
CREATE POLICY "Allow users to upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'aeronotes-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Allow users to update their own documents" ON storage.objects;
CREATE POLICY "Allow users to update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'aeronotes-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Allow users to delete their own documents" ON storage.objects;
CREATE POLICY "Allow users to delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'aeronotes-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Function to get user's auto-delete timeout for a specific content type
CREATE OR REPLACE FUNCTION get_user_timeout(user_uuid UUID, content_type TEXT)
RETURNS INTEGER AS $$
DECLARE
  timeout_seconds INTEGER;
BEGIN
  IF content_type = 'document' THEN
    SELECT COALESCE(ads.document_timeout_seconds, 86400) INTO timeout_seconds
    FROM auto_delete_settings ads
    WHERE ads.user_id = user_uuid;
    RETURN COALESCE(timeout_seconds, 86400); -- Default 24 hours if no user-specific setting

  ELSIF content_type = 'note' THEN
    SELECT COALESCE(ads.note_timeout_seconds, 3600) INTO timeout_seconds
    FROM auto_delete_settings ads
    WHERE ads.user_id = user_uuid;
    RETURN COALESCE(timeout_seconds, 3600); -- Default 1 hour

  ELSIF content_type = 'image' THEN
    SELECT COALESCE(ads.image_timeout_seconds, 43200) INTO timeout_seconds
    FROM auto_delete_settings ads
    WHERE ads.user_id = user_uuid;
    RETURN COALESCE(timeout_seconds, 43200); -- Default 12 hours

  ELSE
    RETURN 3600; -- Default fallback of 1 hour
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improved auto-delete trigger function for documents
CREATE OR REPLACE FUNCTION handle_documents_auto_delete()
RETURNS TRIGGER AS $$
DECLARE
  timeout_seconds INTEGER;
BEGIN
  IF NEW.auto_delete = true AND (OLD IS NULL OR OLD.auto_delete IS DISTINCT FROM true OR OLD.auto_delete_timeout_seconds IS DISTINCT FROM NEW.auto_delete_timeout_seconds) THEN
    timeout_seconds := COALESCE(NEW.auto_delete_timeout_seconds, get_user_timeout(NEW.user_id, 'document'));
    NEW.scheduled_deletion := NOW() + (timeout_seconds * INTERVAL '1 second');
  ELSIF NEW.auto_delete = false AND (OLD IS NULL OR OLD.auto_delete = true) THEN
    NEW.scheduled_deletion := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improved auto-delete trigger function for notes
CREATE OR REPLACE FUNCTION handle_notes_auto_delete()
RETURNS TRIGGER AS $$
DECLARE
  timeout_seconds INTEGER;
BEGIN
  IF NEW.auto_delete = true AND (OLD IS NULL OR OLD.auto_delete IS DISTINCT FROM true OR OLD.auto_delete_timeout_seconds IS DISTINCT FROM NEW.auto_delete_timeout_seconds) THEN
    timeout_seconds := COALESCE(NEW.auto_delete_timeout_seconds, get_user_timeout(NEW.user_id, 'note'));
    NEW.scheduled_deletion := NOW() + (timeout_seconds * INTERVAL '1 second');
  ELSIF NEW.auto_delete = false AND (OLD IS NULL OR OLD.auto_delete = true) THEN
    NEW.scheduled_deletion := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improved auto-delete trigger function for images
CREATE OR REPLACE FUNCTION handle_images_auto_delete()
RETURNS TRIGGER AS $$
DECLARE
  timeout_seconds INTEGER;
BEGIN
  IF NEW.auto_delete = true AND (OLD IS NULL OR OLD.auto_delete IS DISTINCT FROM true OR OLD.auto_delete_timeout_seconds IS DISTINCT FROM NEW.auto_delete_timeout_seconds) THEN
    timeout_seconds := COALESCE(NEW.auto_delete_timeout_seconds, get_user_timeout(NEW.user_id, 'image'));
    NEW.scheduled_deletion := NOW() + (timeout_seconds * INTERVAL '1 second');
  ELSIF NEW.auto_delete = false AND (OLD IS NULL OR OLD.auto_delete = true) THEN
    NEW.scheduled_deletion := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for auto_delete
DROP TRIGGER IF EXISTS on_documents_auto_delete_update ON documents;
CREATE TRIGGER on_documents_auto_delete_update
BEFORE UPDATE ON documents
FOR EACH ROW
WHEN (OLD.auto_delete IS DISTINCT FROM NEW.auto_delete OR 
      OLD.auto_delete_timeout_seconds IS DISTINCT FROM NEW.auto_delete_timeout_seconds)
EXECUTE FUNCTION handle_documents_auto_delete();

DROP TRIGGER IF EXISTS on_documents_auto_delete_insert ON documents;
CREATE TRIGGER on_documents_auto_delete_insert
BEFORE INSERT ON documents
FOR EACH ROW
WHEN (NEW.auto_delete = true)
EXECUTE FUNCTION handle_documents_auto_delete();

DROP TRIGGER IF EXISTS on_notes_auto_delete_update ON notes;
CREATE TRIGGER on_notes_auto_delete_update
BEFORE UPDATE ON notes
FOR EACH ROW
WHEN (OLD.auto_delete IS DISTINCT FROM NEW.auto_delete OR 
      OLD.auto_delete_timeout_seconds IS DISTINCT FROM NEW.auto_delete_timeout_seconds)
EXECUTE FUNCTION handle_notes_auto_delete();

DROP TRIGGER IF EXISTS on_notes_auto_delete_insert ON notes;
CREATE TRIGGER on_notes_auto_delete_insert
BEFORE INSERT ON notes
FOR EACH ROW
WHEN (NEW.auto_delete = true)
EXECUTE FUNCTION handle_notes_auto_delete();

DROP TRIGGER IF EXISTS on_images_auto_delete_update ON images;
CREATE TRIGGER on_images_auto_delete_update
BEFORE UPDATE ON images
FOR EACH ROW
WHEN (OLD.auto_delete IS DISTINCT FROM NEW.auto_delete OR 
      OLD.auto_delete_timeout_seconds IS DISTINCT FROM NEW.auto_delete_timeout_seconds)
EXECUTE FUNCTION handle_images_auto_delete();

DROP TRIGGER IF EXISTS on_images_auto_delete_insert ON images;
CREATE TRIGGER on_images_auto_delete_insert
BEFORE INSERT ON images
FOR EACH ROW
WHEN (NEW.auto_delete = true)
EXECUTE FUNCTION handle_images_auto_delete();

-- Improved deletion function that handles storage objects too
CREATE OR REPLACE FUNCTION delete_scheduled_items()
RETURNS void AS $$
DECLARE
  doc_record RECORD;
  note_record RECORD;
  image_record RECORD;
BEGIN
  -- Process Documents
  FOR doc_record IN
    SELECT id, file_path, user_id FROM documents
    WHERE scheduled_deletion IS NOT NULL AND scheduled_deletion <= NOW()
  LOOP
    IF doc_record.file_path IS NOT NULL THEN
      DECLARE
        storage_path TEXT;
      BEGIN
        IF position('aeronotes-documents/' IN doc_record.file_path) > 0 THEN
          storage_path := substring(doc_record.file_path FROM position('aeronotes-documents/' IN doc_record.file_path) + length('aeronotes-documents/'));
        ELSE
          storage_path := doc_record.file_path;
        END IF;
        
        EXECUTE 'DELETE FROM storage.objects WHERE bucket_id = $1 AND name = $2'
        USING 'aeronotes-documents', storage_path;
        RAISE LOG 'Attempted to delete from storage: aeronotes-documents/%', storage_path;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'Error deleting document file from storage: % - %', SQLSTATE, SQLERRM;
      END;
    END IF;
    DELETE FROM documents WHERE id = doc_record.id;
    RAISE LOG 'Auto-deleted DOCUMENT id: %, FilePath: % for user: %', doc_record.id, doc_record.file_path, doc_record.user_id;
  END LOOP;

  -- Process Notes
  FOR note_record IN
    SELECT id, user_id FROM notes
    WHERE scheduled_deletion IS NOT NULL AND scheduled_deletion <= NOW()
  LOOP
    DELETE FROM notes WHERE id = note_record.id;
    RAISE LOG 'Auto-deleted NOTE id: % for user: %', note_record.id, note_record.user_id;
  END LOOP;

  -- Process Images
  FOR image_record IN
    SELECT id, file_path, user_id FROM images 
    WHERE scheduled_deletion IS NOT NULL AND scheduled_deletion <= NOW()
  LOOP
    IF image_record.file_path IS NOT NULL THEN
      DECLARE
        storage_path TEXT;
      BEGIN
        IF position('images/' IN image_record.file_path) > 0 THEN
          storage_path := substring(image_record.file_path FROM position('images/' IN image_record.file_path) + length('images/'));
        ELSE
          storage_path := image_record.file_path;
        END IF;
        
        EXECUTE 'DELETE FROM storage.objects WHERE bucket_id = $1 AND name = $2'
        USING 'images', storage_path;
        RAISE LOG 'Attempted to delete from storage: images/%', storage_path;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'Error deleting image file from storage: % - %', SQLSTATE, SQLERRM;
      END;
    END IF;
    DELETE FROM images WHERE id = image_record.id;
    RAISE LOG 'Auto-deleted IMAGE id: %, FilePath: % for user: %', image_record.id, image_record.file_path, image_record.user_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set user_id if it's not already provided (e.g., during a direct insert with user_id specified)
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically set user_id for tables that need it on direct user actions
DROP TRIGGER IF EXISTS set_documents_user_id ON documents;
CREATE TRIGGER set_documents_user_id
    BEFORE INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_notes_user_id ON notes;
CREATE TRIGGER set_notes_user_id
    BEFORE INSERT ON notes
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_images_user_id ON images;
CREATE TRIGGER set_images_user_id
    BEFORE INSERT ON images
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- The auto_delete_settings table gets user_id through direct inserts or the handle_new_user trigger,
-- so it doesn't need the generic set_user_id trigger.
DROP TRIGGER IF EXISTS set_auto_delete_settings_user_id ON auto_delete_settings; 

-- Set up cron job for auto-deletion (uncomment in production)
-- SELECT cron.schedule('auto-deletion-job', '* * * * *', 'SELECT delete_scheduled_items()');

-- Insert default settings for new users via a trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.auto_delete_settings (user_id, document_timeout_seconds, note_timeout_seconds, image_timeout_seconds)
  VALUES (NEW.id, 86400, 3600, 43200)
  ON CONFLICT (user_id) DO NOTHING; -- Avoid error if settings somehow already exist
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default settings for existing users (if any) who might not have them
-- Temporarily disable the user_id trigger for auto_delete_settings for this batch insert
ALTER TABLE auto_delete_settings DISABLE TRIGGER set_auto_delete_settings_user_id;

INSERT INTO auto_delete_settings (user_id, document_timeout_seconds, note_timeout_seconds, image_timeout_seconds)
SELECT id, 86400, 3600, 43200
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1
    FROM auto_delete_settings ads
    WHERE ads.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Re-enable the trigger if it was previously defined (and if we still want it)
-- For now, we are removing it as user_id is explicitly handled for auto_delete_settings.

-- However, the set_user_id trigger was removed above with DROP TRIGGER. 
-- The explicit inserts in handle_new_user and this backfill script cover user_id for auto_delete_settings.
