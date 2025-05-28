-- AeroNotes Authentication Database Setup
-- Run this in Supabase SQL Editor

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone_number text UNIQUE NOT NULL,
  phone_suffix integer NOT NULL,
  email text,
  pin_hash text NOT NULL,
  pin_length integer DEFAULT 4,
  is_pin_set boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create sessions table for JWT session management
CREATE TABLE IF NOT EXISTS sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  access_token_hash text NOT NULL,
  refresh_token_hash text NOT NULL,
  device_info jsonb,
  ip_address inet,
  user_agent text,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create token blacklist for secure logout
CREATE TABLE IF NOT EXISTS token_blacklist (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  token_hash text UNIQUE NOT NULL,
  token_type text NOT NULL CHECK (token_type IN ('access', 'refresh')),
  expires_at timestamp with time zone NOT NULL,
  blacklisted_at timestamp with time zone DEFAULT now()
);

-- Create audit logs for security monitoring
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text,
  details jsonb,
  ip_address inet,
  user_agent text,
  success boolean NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone_number text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  attempts integer DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone_suffix ON user_profiles(phone_suffix);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone_number);

-- Add Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own data" ON user_profiles;
CREATE POLICY "Users can view own data" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Sessions belong to user" ON sessions;
CREATE POLICY "Sessions belong to user" ON sessions
  FOR ALL USING (auth.uid() = user_id);

-- Admin-only policies for audit logs
DROP POLICY IF EXISTS "Admin can view all audit logs" ON audit_logs;
CREATE POLICY "Admin can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND email = 'admin@aeronotes.com'
    )
  );

-- Insert a test admin user (for testing)
INSERT INTO user_profiles (phone_number, phone_suffix, pin_hash, pin_length, is_pin_set, email) 
VALUES (
  '+1234567890', 
  7890,
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LEMNqp.T8..3F6a6C', -- bcrypt hash of '1234'
  4,
  true,
  'admin@aeronotes.com'
) ON CONFLICT (phone_number) DO NOTHING;

-- Grant necessary permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'AeroNotes authentication database setup completed successfully!' as message; 