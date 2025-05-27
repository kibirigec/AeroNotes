import supabaseAdmin from '../supabaseAdmin';

/**
 * OTP Storage service using Supabase
 * Handles storing and retrieving OTP codes with expiration
 */
export class OTPStorage {
  static TABLE_NAME = 'otp_codes';
  static DEFAULT_EXPIRY_MINUTES = 10;

  /**
   * Store OTP code for a phone number
   * @param {string} phoneNumber - E.164 formatted phone number
   * @param {string} otp - The OTP code
   * @param {number} expiryMinutes - Expiry time in minutes (default: 10)
   * @param {string} messageId - Optional message ID from provider
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async storeOTP(phoneNumber, otp, expiryMinutes = OTPStorage.DEFAULT_EXPIRY_MINUTES, messageId = null) {
    try {
      const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);
      
      // First, clean up any existing unverified OTPs for this phone number
      console.log(`Cleaning up existing OTPs for ${phoneNumber}...`);
      await supabaseAdmin
        .from(this.TABLE_NAME)
        .delete()
        .eq('phone_number', phoneNumber)
        .eq('verified', false);
      
      // Also clean up any expired OTPs globally
      await this.cleanupExpiredOTPs();
      
      // Insert new OTP record
      console.log(`Inserting new OTP for ${phoneNumber}...`);
      const { data, error } = await supabaseAdmin
        .from(this.TABLE_NAME)
        .insert({
          phone_number: phoneNumber,
          otp_code: otp,
          expires_at: expiryDate.toISOString(),
          message_id: messageId,
          verified: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing OTP:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ OTP stored successfully for ${phoneNumber}, ID: ${data.id}`);
      return { success: true };
    } catch (err) {
      console.error('Error in storeOTP:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Retrieve and verify OTP code
   * @param {string} phoneNumber - E.164 formatted phone number
   * @param {string} otp - The OTP code to verify
   * @returns {Promise<{success: boolean, expired?: boolean, messageId?: string, error?: string}>}
   */
  static async verifyOTP(phoneNumber, otp) {
    try {
      console.log(`🔍 OTPStorage.verifyOTP called with: phone=${phoneNumber}, otp=${otp}`);
      
      // First clean up expired OTPs
      await this.cleanupExpiredOTPs();
      
      const { data, error } = await supabaseAdmin
        .from(this.TABLE_NAME)
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('verified', false)
        .single();

      if (error || !data) {
        console.log(`❌ No OTP found for ${phoneNumber}:`, error);
        return { success: false, error: 'No valid OTP found for this phone number' };
      }

      console.log(`📋 Found OTP record for ${phoneNumber}:`, {
        stored_otp: data.otp_code,
        stored_type: typeof data.otp_code,
        input_otp: otp,
        input_type: typeof otp,
        expires_at: data.expires_at,
        created_at: data.created_at
      });

      // Check if expired
      const now = new Date();
      const expiryDate = new Date(data.expires_at);
      if (now > expiryDate) {
        console.log(`⏰ OTP expired for ${phoneNumber}: now=${now.toISOString()}, expires=${expiryDate.toISOString()}`);
        // Clean up expired OTP
        await supabaseAdmin
          .from(this.TABLE_NAME)
          .delete()
          .eq('phone_number', phoneNumber);
        
        return { success: false, expired: true, error: 'OTP has expired' };
      }

      // Ensure both values are strings for comparison
      const storedOTP = String(data.otp_code).trim();
      const inputOTP = String(otp).trim();
      
      console.log(`🔍 OTP comparison: stored="${storedOTP}" vs input="${inputOTP}" | match=${storedOTP === inputOTP}`);

      // Check if OTP matches
      if (storedOTP !== inputOTP) {
        console.log(`❌ OTP mismatch for ${phoneNumber}: stored="${storedOTP}" !== input="${inputOTP}"`);
        return { success: false, error: 'Invalid OTP code' };
      }

      console.log(`✅ OTP match confirmed for ${phoneNumber}, deleting record...`);

      // Mark as verified and delete
      await supabaseAdmin
        .from(this.TABLE_NAME)
        .delete()
        .eq('phone_number', phoneNumber);

      console.log(`🗑️ OTP record deleted for ${phoneNumber}`);

      return { 
        success: true, 
        messageId: data.message_id 
      };
    } catch (err) {
      console.error('Error in verifyOTP:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Clean up expired OTP codes
   * @param {string} phoneNumber - Optional: clean only for specific phone number
   */
  static async cleanupExpiredOTPs(phoneNumber = null) {
    try {
      let query = supabaseAdmin
        .from(this.TABLE_NAME)
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (phoneNumber) {
        query = query.eq('phone_number', phoneNumber);
      }

      await query;
    } catch (err) {
      console.error('Error cleaning up expired OTPs:', err);
    }
  }

  /**
   * Get statistics about OTP storage
   * @returns {Promise<{totalActive: number, expiredCount: number}>}
   */
  static async getStats() {
    try {
      const now = new Date().toISOString();
      
      const { count: totalActive } = await supabaseAdmin
        .from(this.TABLE_NAME)
        .select('*', { count: 'exact', head: true })
        .gte('expires_at', now);

      const { count: expiredCount } = await supabaseAdmin
        .from(this.TABLE_NAME)
        .select('*', { count: 'exact', head: true })
        .lt('expires_at', now);

      return { totalActive: totalActive || 0, expiredCount: expiredCount || 0 };
    } catch (err) {
      console.error('Error getting OTP stats:', err);
      return { totalActive: 0, expiredCount: 0 };
    }
  }
} 