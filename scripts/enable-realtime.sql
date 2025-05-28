-- Enable Supabase Realtime for AeroNotes
-- Run this in your Supabase SQL Editor

-- Enable realtime for files table (for gallery images and documents)
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;

-- Enable realtime for notes table (for text notes)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;

-- Verify realtime is enabled for both tables
-- You can run this query to check:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Note: The useRealtimeSync hook will now listen for changes on both tables
-- and update the UI across all connected devices for:
-- - Files (images and documents)
-- - Notes (text notes)
-- 
-- Changes include INSERT, UPDATE, and DELETE operations 