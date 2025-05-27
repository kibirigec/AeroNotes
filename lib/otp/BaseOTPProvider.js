/**
 * Base abstract class for OTP providers
 * All OTP service providers should extend this class
 */
export class BaseOTPProvider {
  constructor(config) {
    this.config = config;
  }

  /**
   * Send OTP to a phone number
   * @param {string} phoneNumber - E.164 formatted phone number
   * @param {string} otp - The OTP code to send
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendOTP(phoneNumber, otp) {
    throw new Error('sendOTP method must be implemented by OTP provider');
  }

  /**
   * Verify OTP code (some providers support server-side verification)
   * @param {string} phoneNumber - E.164 formatted phone number
   * @param {string} otp - The OTP code to verify
   * @param {string} messageId - Message ID from send operation (if applicable)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async verifyOTP(phoneNumber, otp, messageId) {
    throw new Error('verifyOTP method must be implemented by OTP provider');
  }

  /**
   * Get provider name for logging/debugging
   * @returns {string}
   */
  getProviderName() {
    return this.constructor.name;
  }

  /**
   * Validate provider configuration
   * @returns {boolean}
   */
  isConfigured() {
    throw new Error('isConfigured method must be implemented by OTP provider');
  }

  /**
   * Get supported features of this provider
   * @returns {{serverSideVerification: boolean, deliveryStatus: boolean}}
   */
  getSupportedFeatures() {
    return {
      serverSideVerification: false,
      deliveryStatus: false
    };
  }
} 