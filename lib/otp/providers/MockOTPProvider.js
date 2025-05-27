import { BaseOTPProvider } from '../BaseOTPProvider.js';

/**
 * Mock OTP Provider for development and testing
 * Logs OTP codes to console instead of sending SMS
 */
export class MockOTPProvider extends BaseOTPProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'Mock OTP Provider';
  }

  /**
   * Mock send OTP - just logs to console
   * @param {string} phoneNumber - E.164 formatted phone number
   * @param {string} otp - The OTP code to "send"
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendOTP(phoneNumber, otp) {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      // Simulate occasional failures if configured
      const failureRate = this.config.simulateFailures ? 0.1 : 0;
      if (Math.random() < failureRate) {
        return {
          success: false,
          error: 'Simulated network failure'
        };
      }

      // Log the OTP (in development only)
      const messageId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('\n' + '='.repeat(60));
      console.log('📱 MOCK OTP PROVIDER - SMS SIMULATION');
      console.log('='.repeat(60));
      console.log(`📞 To: ${phoneNumber}`);
      console.log(`🔐 OTP Code: ${otp}`);
      console.log(`📨 Message ID: ${messageId}`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
      console.log('='.repeat(60));
      console.log('💡 This is a mock - no actual SMS was sent!\n');

      return {
        success: true,
        messageId: messageId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mock verify OTP - always returns success for valid format
   * @param {string} phoneNumber - E.164 formatted phone number
   * @param {string} otp - The OTP code to verify
   * @param {string} messageId - Message ID from send operation
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async verifyOTP(phoneNumber, otp, messageId) {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));
      
      // Basic validation
      if (!otp || !/^\d{4,8}$/.test(otp)) {
        return {
          success: false,
          error: 'Invalid OTP format'
        };
      }

      console.log(`🔍 Mock OTP verification for ${phoneNumber}: ${otp} (Message ID: ${messageId})`);
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if provider is configured (mock is always ready)
   * @returns {boolean}
   */
  isConfigured() {
    return true;
  }

  /**
   * Get supported features
   * @returns {{serverSideVerification: boolean, deliveryStatus: boolean}}
   */
  getSupportedFeatures() {
    return {
      serverSideVerification: true, // Mock supports verification
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
      type: 'mock',
      configured: this.isConfigured(),
      config: {
        simulateFailures: this.config.simulateFailures || false
      }
    };
  }
} 