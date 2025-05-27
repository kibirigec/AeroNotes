import { BaseOTPProvider } from '../BaseOTPProvider.js';

/**
 * Infobip OTP Provider
 * Sends OTP codes via Infobip's 2FA API
 */
export class InfobipOTPProvider extends BaseOTPProvider {
  constructor(config) {
    super(config);
    this.name = 'Infobip 2FA Provider';
    
    // Extract configuration
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.applicationId = config.applicationId;
    this.messageId = config.messageId;
    this.senderId = config.senderId || 'ServiceSMS';
  }

  /**
   * Send OTP via Infobip 2FA API
   * @param {string} phoneNumber - E.164 formatted phone number
   * @param {string} otp - The OTP code to send
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendOTP(phoneNumber, otp) {
    try {
      // Normalize phone number for Infobip (remove + prefix)
      const normalizedPhoneNumber = phoneNumber.replace(/^\+/, '');
      
      const url = `${this.baseUrl}/2fa/2/pin`;
      const headers = new Headers();
      headers.append("Authorization", `App ${this.apiKey}`);
      headers.append("Content-Type", "application/json");
      headers.append("Accept", "application/json");

      const body = JSON.stringify({
        "applicationId": this.applicationId,
        "messageId": this.messageId,
        "to": normalizedPhoneNumber,
      });

      const requestOptions = {
        method: "POST",
        headers: headers,
        body: body,
        redirect: "follow"
      };

      console.log(`📤 Infobip: Sending OTP to ${phoneNumber} via 2FA API`);
      
      const response = await fetch(url, requestOptions);
      const responseText = await response.text();

      if (!response.ok) {
        console.error('Infobip API Error:', response.status, responseText);
        
        let errorMessage = 'Failed to send OTP via Infobip.';
        try {
          const errorJson = JSON.parse(responseText);
          errorMessage = errorJson?.requestError?.serviceException?.text || 
                        errorJson?.requestError?.serviceException?.messageId || 
                        `Infobip API error: ${response.status}`;
        } catch (e) {
          errorMessage = `Infobip API error: ${response.status} - ${responseText}`;
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

      const result = JSON.parse(responseText);
      console.log("✅ Infobip: OTP sent successfully", result);

      return {
        success: true,
        messageId: result.pinId || result.messageId
      };

    } catch (error) {
      console.error('Error sending OTP via Infobip:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify OTP via Infobip (if supported)
   * Note: Infobip 2FA has verify endpoint, but for simplicity we rely on local verification
   * @param {string} phoneNumber - E.164 formatted phone number  
   * @param {string} otp - The OTP code to verify
   * @param {string} messageId - Pin ID from Infobip
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async verifyOTP(phoneNumber, otp, messageId) {
    try {
      if (!messageId) {
        return {
          success: false,
          error: 'Message ID required for Infobip verification'
        };
      }

      const url = `${this.baseUrl}/2fa/2/pin/${messageId}/verify`;
      const headers = new Headers();
      headers.append("Authorization", `App ${this.apiKey}`);
      headers.append("Content-Type", "application/json");
      headers.append("Accept", "application/json");

      const body = JSON.stringify({
        "pin": otp
      });

      const requestOptions = {
        method: "POST",
        headers: headers,
        body: body,
        redirect: "follow"
      };

      console.log(`🔍 Infobip: Verifying OTP for ${phoneNumber}`);
      
      const response = await fetch(url, requestOptions);
      const responseText = await response.text();

      if (!response.ok) {
        console.error('Infobip verification error:', response.status, responseText);
        return {
          success: false,
          error: `Infobip verification failed: ${response.status}`
        };
      }

      const result = JSON.parse(responseText);
      console.log("✅ Infobip: OTP verified", result);

      return {
        success: result.verified === true
      };

    } catch (error) {
      console.error('Error verifying OTP via Infobip:', error);
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
    return !!(this.baseUrl && this.apiKey && this.applicationId && this.messageId);
  }

  /**
   * Get supported features
   * @returns {{serverSideVerification: boolean, deliveryStatus: boolean}}
   */
  getSupportedFeatures() {
    return {
      serverSideVerification: true, // Infobip supports server-side verification
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
      type: 'infobip',
      configured: this.isConfigured(),
      config: {
        baseUrl: this.baseUrl,
        applicationId: this.applicationId,
        messageId: this.messageId,
        senderId: this.senderId,
        apiKeyConfigured: !!this.apiKey
      }
    };
  }
} 