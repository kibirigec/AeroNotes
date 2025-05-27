-- Fix Storage Policies for File Uploads
-- This script resolves RLS policy violations for images and documents

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to access their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to access their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "User can manage their own image files" ON storage.objects;
DROP POLICY IF EXISTS "User can manage their own document files" ON storage.objects;

-- Create comprehensive policies for both buckets using unified approach
-- For 'images' bucket
CREATE POLICY "Images: Users can manage their own files"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'images' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  )
  WITH CHECK (
    bucket_id = 'images' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- For 'aeronotes-documents' bucket  
CREATE POLICY "Documents: Users can manage their own files"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'aeronotes-documents' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  )
  WITH CHECK (
    bucket_id = 'aeronotes-documents' AND 
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Allow public read access for images (since bucket is public)
CREATE POLICY "Images: Public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'images');

-- Allow public read access for documents (since bucket is public)  
CREATE POLICY "Documents: Public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'aeronotes-documents');

-- Ensure buckets exist and are properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('aeronotes-documents', 'aeronotes-documents', true, 104857600, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

-- Test query to verify policies work (uncomment to test)
-- SELECT 
--   bucket_id,
--   name,
--   (string_to_array(name, '/'))[1] as extracted_user_id,
--   auth.uid()::text as current_user_id,
--   auth.uid()::text = (string_to_array(name, '/'))[1] as policy_match
-- FROM storage.objects 
-- WHERE bucket_id IN ('images', 'aeronotes-documents')
-- LIMIT 5; 