/**
 * Script to create the OTP codes table
 * Run this script to set up the OTP functionality
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

import supabaseAdmin from '../lib/supabaseAdmin.js';

const createOTPTable = async () => {
  console.log('Creating OTP codes table...');
  
  try {
    // Create the otp_codes table
    const { error: tableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Create otp_codes table
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

        -- Create indexes for faster lookups
        CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_number ON otp_codes(phone_number);
        CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);
        CREATE INDEX IF NOT EXISTS idx_otp_codes_verified ON otp_codes(verified);

        -- Create unique constraint to ensure only one active OTP per phone number
        CREATE UNIQUE INDEX IF NOT EXISTS idx_otp_codes_phone_active 
        ON otp_codes(phone_number) 
        WHERE verified = FALSE AND expires_at > NOW();

        -- Enable Row Level Security
        ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

        -- Create policies for access control
        DROP POLICY IF EXISTS "Allow service role full access to otp_codes" ON otp_codes;
        CREATE POLICY "Allow service role full access to otp_codes" ON otp_codes
        FOR ALL USING (auth.role() = 'service_role');

        -- Function to update updated_at column
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

        -- Function to clean up expired OTPs
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
      `
    });

    if (tableError) {
      console.error('Error creating OTP table:', tableError);
      return false;
    }

    console.log('✅ OTP codes table created successfully');
    return true;

  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
};

// Alternative approach using direct SQL execution
const createOTPTableDirect = async () => {
  console.log('Creating OTP codes table (direct approach)...');
  
  try {
    // Check if table exists
    const { data: tableExists } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'otp_codes')
      .single();

    if (tableExists) {
      console.log('✅ OTP codes table already exists');
      return true;
    }

    // Create table using raw SQL
    const createTableSQL = `
      CREATE TABLE otp_codes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        phone_number TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        message_id TEXT,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (createError) {
      console.error('Error creating table:', createError);
      return false;
    }

    // Create indexes
    const indexSQL = `
      CREATE INDEX idx_otp_codes_phone_number ON otp_codes(phone_number);
      CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);
      CREATE INDEX idx_otp_codes_verified ON otp_codes(verified);
      CREATE UNIQUE INDEX idx_otp_codes_phone_active 
      ON otp_codes(phone_number) 
      WHERE verified = FALSE AND expires_at > NOW();
    `;

    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
      sql: indexSQL
    });

    if (indexError) {
      console.warn('Warning creating indexes:', indexError);
    }

    console.log('✅ OTP codes table created successfully');
    return true;

  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
};

// Test the table creation
const testTableCreation = async () => {
  console.log('Testing OTP table creation...');
  
  try {
    // Try to insert a test record
    const testOTP = {
      phone_number: '+1234567890',
      otp_code: '123456',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
      message_id: 'test-message-id'
    };

    const { data, error } = await supabaseAdmin
      .from('otp_codes')
      .insert(testOTP)
      .select()
      .single();

    if (error) {
      console.error('Error inserting test OTP:', error);
      return false;
    }

    console.log('✅ Test OTP inserted:', data.id);

    // Clean up test record
    const { error: deleteError } = await supabaseAdmin
      .from('otp_codes')
      .delete()
      .eq('id', data.id);

    if (deleteError) {
      console.warn('Warning deleting test OTP:', deleteError);
    } else {
      console.log('✅ Test OTP cleaned up');
    }

    return true;

  } catch (error) {
    console.error('Error testing table:', error.message);
    return false;
  }
};

// Main execution
const main = async () => {
  console.log('=== OTP Table Setup ===\n');
  
  // Try direct table creation first
  const success = await createOTPTableDirect();
  
  if (success) {
    // Test the table
    await testTableCreation();
    console.log('\n✅ OTP table setup completed successfully!');
    console.log('You can now use the OTP service in your application.');
  } else {
    console.log('\n❌ OTP table setup failed.');
    console.log('Please check your database connection and permissions.');
  }
};

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { createOTPTable, createOTPTableDirect, testTableCreation }; 