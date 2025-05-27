-- Fix Storage Policies for File Uploads (Supabase Compatible)
-- Run this in Supabase SQL Editor with your service role

-- First, ensure the buckets exist with correct configuration
-- Note: This will only work if buckets don't exist, or update existing ones
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('aeronotes-documents', 'aeronotes-documents', true, 104857600, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv'];

-- Drop existing policies (if they exist)
DO $$
BEGIN
  -- Drop image policies
  DROP POLICY IF EXISTS "Images: Users can manage their own files" ON storage.objects;
  DROP POLICY IF EXISTS "Images: Public read access" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to access their own files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to upload their own files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
  DROP POLICY IF EXISTS "User can manage their own image files" ON storage.objects;
  
  -- Drop document policies  
  DROP POLICY IF EXISTS "Documents: Users can manage their own files" ON storage.objects;
  DROP POLICY IF EXISTS "Documents: Public read access" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to access their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to upload their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to update their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to delete their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "User can manage their own document files" ON storage.objects;
  
  -- Drop any other conflicting policies
  DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Some policies may not exist, continuing...';
END $$;

-- Create storage policies for images bucket
CREATE POLICY "Images: Users can upload to their own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'images' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Images: Users can view their own files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'images' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Images: Users can update their own files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'images' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Images: Users can delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'images' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Create storage policies for documents bucket
CREATE POLICY "Documents: Users can upload to their own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'aeronotes-documents' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Documents: Users can view their own files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'aeronotes-documents' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Documents: Users can update their own files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'aeronotes-documents' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Documents: Users can delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'aeronotes-documents' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Allow public read access for both buckets (since they are public)
CREATE POLICY "Public: Can view images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');

CREATE POLICY "Public: Can view documents"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'aeronotes-documents');

-- Verify the setup
SELECT 
  'Buckets configured:' as status,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('images', 'aeronotes-documents'); 