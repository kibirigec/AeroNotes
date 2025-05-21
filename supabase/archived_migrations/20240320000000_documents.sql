-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to create buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Allow authenticated users to manage buckets" ON storage.buckets;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_documents_user_id ON documents;
DROP FUNCTION IF EXISTS set_user_id();

-- Comment out the original destructive drop
-- -- Drop the table if it exists to ensure clean state
-- DROP TABLE IF EXISTS documents;

-- Create documents table if it doesn't exist (with the full original schema)
-- This statement will create the table *only if it does not exist at all*.
-- It will NOT add missing columns to an existing table if the table schema differs.
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    file_path TEXT NOT NULL,
    auto_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_edited TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- If the table 'documents' already existed, the above CREATE TABLE IF NOT EXISTS
-- might not have modified it if its schema was different.
-- We need to ensure 'file_path' column exists.
-- Add it as nullable first to avoid errors if rows exist and the column is new for them.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_path TEXT;

-- The original schema specified 'file_path TEXT NOT NULL'.
-- The following commands attempt to enforce this for existing tables.
-- WARNING: This updates rows where file_path is NULL to 'PENDING_PATH_UPDATE'.
-- Review and update these placeholders manually to actual, valid paths.
UPDATE documents
SET file_path = 'PENDING_PATH_UPDATE'
WHERE file_path IS NULL;

ALTER TABLE documents ALTER COLUMN file_path SET NOT NULL;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies for documents table
CREATE POLICY "Users can view their own documents"
    ON documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
    ON documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
    ON documents FOR DELETE
    USING (auth.uid() = user_id);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Enable RLS on storage.buckets
-- ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create policies for storage.buckets
/*
CREATE POLICY "Allow authenticated users to create buckets"
    ON storage.buckets FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage buckets"
    ON storage.buckets FOR ALL
    TO authenticated
    USING (true);
*/

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('aeronotes-documents', 'aeronotes-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the documents bucket
CREATE POLICY "Authenticated users can upload documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'aeronotes-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Authenticated users can view documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'aeronotes-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Authenticated users can delete their documents"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'aeronotes-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Create function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set user_id
CREATE TRIGGER set_documents_user_id
    BEFORE INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id(); 