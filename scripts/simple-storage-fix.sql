-- Simple Storage Policy Fix (No Ownership Required)
-- This script creates basic policies without modifying system tables

-- Create basic policies for images bucket
-- These will work with the default Supabase setup

-- Policy for uploading images to user's own folder
CREATE POLICY "user_upload_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for viewing own images
CREATE POLICY "user_view_images" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for deleting own images  
CREATE POLICY "user_delete_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for uploading documents to user's own folder
CREATE POLICY "user_upload_documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'aeronotes-documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for viewing own documents
CREATE POLICY "user_view_documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'aeronotes-documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for deleting own documents
CREATE POLICY "user_delete_documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'aeronotes-documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access (for public buckets)
CREATE POLICY "public_view_images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'images');

CREATE POLICY "public_view_documents" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'aeronotes-documents'); 