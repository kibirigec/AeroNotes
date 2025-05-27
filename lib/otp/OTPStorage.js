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
      
      // First, clean up any existing OTPs for this phone number
      await this.cleanupExpiredOTPs(phoneNumber);
      
      const { error } = await supabaseAdmin
        .from(this.TABLE_NAME)
        .upsert({
          phone_number: phoneNumber,
          otp_code: otp,
          expires_at: expiryDate.toISOString(),
          message_id: messageId,
          verified: false,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'phone_number'
        });

      if (error) {
        console.error('Error storing OTP:', error);
        return { success: false, error: error.message };
      }

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
      // First clean up expired OTPs
      await this.cleanupExpiredOTPs();
      
      const { data, error } = await supabaseAdmin
        .from(this.TABLE_NAME)
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('verified', false)
        .single();

      if (error || !data) {
        return { success: false, error: 'No valid OTP found for this phone number' };
      }

      // Check if expired
      const now = new Date();
      const expiryDate = new Date(data.expires_at);
      if (now > expiryDate) {
        // Clean up expired OTP
        await supabaseAdmin
          .from(this.TABLE_NAME)
          .delete()
          .eq('phone_number', phoneNumber);
        
        return { success: false, expired: true, error: 'OTP has expired' };
      }

      // Check if OTP matches
      if (data.otp_code !== otp) {
        return { success: false, error: 'Invalid OTP code' };
      }

      // Mark as verified and delete
      await supabaseAdmin
        .from(this.TABLE_NAME)
        .delete()
        .eq('phone_number', phoneNumber);

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