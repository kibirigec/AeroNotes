import { BaseOTPProvider } from '../BaseOTPProvider.js';

/**
 * Twilio OTP Provider
 * Sends OTP codes via Twilio's SMS API
 */
export class TwilioOTPProvider extends BaseOTPProvider {
  constructor(config) {
    super(config);
    this.name = 'Twilio SMS Provider';
    
    // Extract configuration
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.fromPhoneNumber = config.fromPhoneNumber;
    this.serviceSid = config.serviceSid; // Optional: for Verify API
  }

  /**
   * Send OTP via Twilio SMS API
   * @param {string} phoneNumber - E.164 formatted phone number
   * @param {string} otp - The OTP code to send
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendOTP(phoneNumber, otp) {
    try {
      // If using Twilio Verify service
      if (this.serviceSid) {
        return await this.sendOTPViaVerify(phoneNumber);
      }

      // Standard SMS API
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      
      const formData = new URLSearchParams();
      formData.append('To', phoneNumber);
      formData.append('From', this.fromPhoneNumber);
      formData.append('Body', `Your AeroNotes verification code is: ${otp}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Twilio SMS API Error:', result);
        return {
          success: false,
          error: result.message || `Twilio error: ${response.status}`
        };
      }

      console.log("✅ Twilio: SMS sent successfully", result.sid);

      return {
        success: true,
        messageId: result.sid
      };

    } catch (error) {
      console.error('Error sending OTP via Twilio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send OTP via Twilio Verify API (generates OTP automatically)
   * @param {string} phoneNumber - E.164 formatted phone number
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendOTPViaVerify(phoneNumber) {
    try {
      const url = `https://verify.twilio.com/v2/Services/${this.serviceSid}/Verifications`;
      
      const formData = new URLSearchParams();
      formData.append('To', phoneNumber);
      formData.append('Channel', 'sms');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Twilio Verify API Error:', result);
        return {
          success: false,
          error: result.message || `Twilio Verify error: ${response.status}`
        };
      }

      console.log("✅ Twilio Verify: OTP sent successfully", result.sid);

      return {
        success: true,
        messageId: result.sid
      };

    } catch (error) {
      console.error('Error sending OTP via Twilio Verify:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify OTP via Twilio Verify API
   * @param {string} phoneNumber - E.164 formatted phone number
   * @param {string} otp - The OTP code to verify
   * @param {string} messageId - Message ID from send operation
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async verifyOTP(phoneNumber, otp, messageId) {
    try {
      if (!this.serviceSid) {
        return {
          success: false,
          error: 'Twilio Verify service not configured for verification'
        };
      }

      const url = `https://verify.twilio.com/v2/Services/${this.serviceSid}/VerificationCheck`;
      
      const formData = new URLSearchParams();
      formData.append('To', phoneNumber);
      formData.append('Code', otp);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Twilio Verify check error:', result);
        return {
          success: false,
          error: result.message || `Twilio Verify check failed: ${response.status}`
        };
      }

      console.log("✅ Twilio Verify: OTP verification result", result.status);

      return {
        success: result.status === 'approved'
      };

    } catch (error) {
      console.error('Error verifying OTP via Twilio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if provider is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    const hasBasicConfig = !!(this.accountSid && this.authToken);
    const hasSMSConfig = !!this.fromPhoneNumber;
    const hasVerifyConfig = !!this.serviceSid;
    
    return hasBasicConfig && (hasSMSConfig || hasVerifyConfig);
  }

  /**
   * Get supported features
   * @returns {{serverSideVerification: boolean, deliveryStatus: boolean}}
   */
  getSupportedFeatures() {
    return {
      serverSideVerification: !!this.serviceSid, // Only with Verify API
      deliveryStatus: true
    };
  }

  /**
   * Get provider info for debugging
   * @returns {{name: string, type: string, configured: boolean}}
   */
  getProviderInfo() {
    return {
      name: this.name,
      type: 'twilio',
      configured: this.isConfigured(),
      config: {
        accountSid: this.accountSid,
        fromPhoneNumber: this.fromPhoneNumber,
        serviceSid: this.serviceSid,
        authTokenConfigured: !!this.authToken,
        mode: this.serviceSid ? 'verify' : 'sms'
      }
    };
  }
} 