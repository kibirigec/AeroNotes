-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  auto_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_edited TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  scheduled_deletion TIMESTAMP WITH TIME ZONE,
  file_path TEXT
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  "autoDelete" BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  scheduled_deletion TIMESTAMP WITH TIME ZONE
);

-- Create images table
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  file_name TEXT,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "autoDelete" BOOLEAN DEFAULT false,
  scheduled_deletion TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for documents
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

-- Policies for documents
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Drop existing policies for notes
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

-- Policies for notes
CREATE POLICY "Users can view their own notes" ON notes
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own notes" ON notes
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Drop existing policies for images
DROP POLICY IF EXISTS "Users can view their own images" ON images;
DROP POLICY IF EXISTS "Users can create their own images" ON images;
DROP POLICY IF EXISTS "Users can update their own images" ON images;
DROP POLICY IF EXISTS "Users can delete their own images" ON images;

-- Policies for images
CREATE POLICY "Users can view their own images" ON images
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own images" ON images
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own images" ON images
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own images" ON images
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies for storage.objects
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to access their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

-- Policies for storage.objects
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated WITH CHECK (
  bucket_id = 'images' AND
  auth.uid()::text = owner::text
);

CREATE POLICY "Allow users to access their own files"
ON storage.objects FOR SELECT
TO authenticated USING (
  bucket_id = 'images' AND
  auth.uid()::text = owner::text
);

CREATE POLICY "Allow users to update their own files"
ON storage.objects FOR UPDATE
TO authenticated USING (
  bucket_id = 'images' AND
  auth.uid()::text = owner::text
);

CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated USING (
  bucket_id = 'images' AND
  auth.uid()::text = owner::text
);

-- Trigger function for DOCUMENTS (using snake_case auto_delete)
CREATE OR REPLACE FUNCTION handle_documents_auto_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.auto_delete = true AND (OLD.auto_delete IS DISTINCT FROM true) THEN
    NEW.scheduled_deletion = NOW() + INTERVAL '10 seconds';
  ELSIF NEW.auto_delete = false AND OLD.auto_delete = true THEN
    NEW.scheduled_deletion = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for DOCUMENTS
DROP TRIGGER IF EXISTS on_documents_auto_delete_update ON documents;
CREATE TRIGGER on_documents_auto_delete_update
BEFORE UPDATE ON documents
FOR EACH ROW
WHEN (OLD.auto_delete IS DISTINCT FROM NEW.auto_delete)
EXECUTE FUNCTION handle_documents_auto_delete();

DROP TRIGGER IF EXISTS on_documents_auto_delete_insert ON documents;
CREATE TRIGGER on_documents_auto_delete_insert
BEFORE INSERT ON documents
FOR EACH ROW
WHEN (NEW.auto_delete = true)
EXECUTE FUNCTION handle_documents_auto_delete();

-- Trigger function for NOTES (using quoted camelCase "autoDelete")
CREATE OR REPLACE FUNCTION handle_notes_auto_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."autoDelete" = true AND (OLD."autoDelete" IS DISTINCT FROM true) THEN
    NEW.scheduled_deletion = NOW() + INTERVAL '10 seconds';
  ELSIF NEW."autoDelete" = false AND OLD."autoDelete" = true THEN
    NEW.scheduled_deletion = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for NOTES
DROP TRIGGER IF EXISTS on_notes_auto_delete_update ON notes;
CREATE TRIGGER on_notes_auto_delete_update
BEFORE UPDATE ON notes
FOR EACH ROW
WHEN (OLD."autoDelete" IS DISTINCT FROM NEW."autoDelete")
EXECUTE FUNCTION handle_notes_auto_delete();

DROP TRIGGER IF EXISTS on_notes_auto_delete_insert ON notes;
CREATE TRIGGER on_notes_auto_delete_insert
BEFORE INSERT ON notes
FOR EACH ROW
WHEN (NEW."autoDelete" = true)
EXECUTE FUNCTION handle_notes_auto_delete();

-- Trigger function for IMAGES (using quoted camelCase "autoDelete")
CREATE OR REPLACE FUNCTION handle_images_auto_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."autoDelete" = true AND (OLD."autoDelete" IS DISTINCT FROM true) THEN
    NEW.scheduled_deletion = NOW() + INTERVAL '10 seconds';
  ELSIF NEW."autoDelete" = false AND OLD."autoDelete" = true THEN
    NEW.scheduled_deletion = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for IMAGES
DROP TRIGGER IF EXISTS on_images_auto_delete_update ON images;
CREATE TRIGGER on_images_auto_delete_update
BEFORE UPDATE ON images
FOR EACH ROW
WHEN (OLD."autoDelete" IS DISTINCT FROM NEW."autoDelete")
EXECUTE FUNCTION handle_images_auto_delete();

DROP TRIGGER IF EXISTS on_images_auto_delete_insert ON images;
CREATE TRIGGER on_images_auto_delete_insert
BEFORE INSERT ON images
FOR EACH ROW
WHEN (NEW."autoDelete" = true)
EXECUTE FUNCTION handle_images_auto_delete();

-- Main deletion function (ensure this is consistent with column names)
CREATE OR REPLACE FUNCTION delete_scheduled_documents_and_files()
RETURNS void AS $$
DECLARE
  doc_record RECORD;
  note_record RECORD;
  gallery_record RECORD;
BEGIN
  -- Process Documents (uses doc_record.auto_delete if needed, but not for selection here)
  FOR doc_record IN
    SELECT id, file_path FROM documents
    WHERE scheduled_deletion IS NOT NULL AND scheduled_deletion <= NOW()
  LOOP
    DELETE FROM documents WHERE id = doc_record.id;
    RAISE LOG 'Cron job auto-deleted DOCUMENT id: %, FilePath: % ', doc_record.id, doc_record.file_path;
  END LOOP;

  -- Process Notes (uses note_record."autoDelete" if needed, but not for selection here)
  FOR note_record IN
    SELECT id FROM notes
    WHERE scheduled_deletion IS NOT NULL AND scheduled_deletion <= NOW()
  LOOP
    DELETE FROM notes WHERE id = note_record.id;
    RAISE LOG 'Cron job auto-deleted NOTE id: %', note_record.id;
  END LOOP;

  -- Process Gallery Images (uses gallery_record."autoDelete" if needed, but not for selection here)
  FOR gallery_record IN
    SELECT id, file_path FROM images 
    WHERE scheduled_deletion IS NOT NULL AND scheduled_deletion <= NOW()
  LOOP
    DELETE FROM images WHERE id = gallery_record.id;
    RAISE LOG 'Cron job auto-deleted GALLERY IMAGE id: %, FilePath: % ', gallery_record.id, gallery_record.file_path;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Cron job scheduling (ensure pg_cron is enabled)
-- SELECT cron.schedule('delete-all-job', '*/1 * * * *', 'SELECT delete_scheduled_documents_and_files()');
