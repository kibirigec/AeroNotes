-- AeroNotes OTP Table Setup
-- Run this SQL directly in your Supabase SQL Editor

-- Create otp_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  message_id TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_number ON otp_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_verified ON otp_codes(verified);

-- Create unique constraint to ensure only one unverified OTP per phone number
-- Note: We rely on application logic to clean up expired OTPs
CREATE UNIQUE INDEX IF NOT EXISTS idx_otp_codes_phone_unverified 
ON otp_codes(phone_number) 
WHERE verified = FALSE;

-- Enable Row Level Security
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow service role full access to otp_codes" ON otp_codes;
DROP POLICY IF EXISTS "Allow authenticated access to otp_codes" ON otp_codes;

-- Create policies for both service role and authenticated access
-- This allows both the service role (for admin operations) and authenticated users (API routes)
CREATE POLICY "Allow service role and API access to otp_codes" ON otp_codes
FOR ALL USING (
  auth.role() = 'service_role' OR 
  auth.role() = 'authenticated' OR
  auth.role() = 'anon'
);

-- Function to update updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_otp_codes_updated_at ON otp_codes;
CREATE TRIGGER update_otp_codes_updated_at
BEFORE UPDATE ON otp_codes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired OTPs (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM otp_codes 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Test the setup by trying to insert and then delete a test record
DO $$
DECLARE
  test_id UUID;
BEGIN
  -- Clean up any existing test records first
  DELETE FROM otp_codes WHERE phone_number = '+1234567890' AND message_id = 'test-setup';
  
  -- Insert test record
  INSERT INTO otp_codes (phone_number, otp_code, expires_at, message_id)
  VALUES ('+1234567890', '123456', NOW() + INTERVAL '5 minutes', 'test-setup')
  RETURNING id INTO test_id;
  
  -- Verify it was inserted
  IF test_id IS NOT NULL THEN
    RAISE NOTICE 'Test record inserted successfully with ID: %', test_id;
    
    -- Clean up test record
    DELETE FROM otp_codes WHERE id = test_id;
    RAISE NOTICE 'Test record cleaned up successfully';
    RAISE NOTICE '✅ OTP table setup completed successfully!';
  ELSE
    RAISE EXCEPTION 'Failed to insert test record';
  END IF;
END $$;

-- Show final status
SELECT 
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE verified = FALSE AND expires_at > NOW()) as active_otps,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_otps
FROM otp_codes; 