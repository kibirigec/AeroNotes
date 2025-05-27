-- Create OTP codes table for storing verification codes
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    message_id TEXT, -- Provider message ID for tracking
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_number ON otp_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_verified ON otp_codes(verified);

-- Add unique constraint to ensure one active OTP per phone number
CREATE UNIQUE INDEX IF NOT EXISTS idx_otp_codes_phone_active 
ON otp_codes(phone_number) 
WHERE verified = FALSE AND expires_at > NOW();

-- Add RLS (Row Level Security) policies
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Allow service role full access" ON otp_codes
FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update the updated_at column
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
    DELETE FROM otp_codes WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql; 