/**
 * OTP Service Wrapper
 * Integrates existing OTP functionality with the new modular architecture
 */

import { BaseService } from '../index.js';
import { OTPService as ExistingOTPService } from '../../otp/OTPService.js';
import { getOTPConfig } from '../../core/config/index.js';

/**
 * OTP service wrapper
 */
export class OTPService extends BaseService {
  constructor() {
    super('OTPService');
    this.otpConfig = getOTPConfig();
    this.otpService = null;
  }

  async onInitialize() {
    // Initialize the existing OTP service
    this.otpService = new ExistingOTPService();
    console.log('OTP Service initialized with new architecture');
  }

  /**
   * Send OTP
   */
  async sendOTP(phoneNumber, options = {}) {
    if (!this.otpService) {
      throw new Error('OTP service not initialized');
    }
    
    return await this.otpService.sendOTP(phoneNumber, options);
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phoneNumber, otp) {
    if (!this.otpService) {
      throw new Error('OTP service not initialized');
    }
    
    return await this.otpService.verifyOTP(phoneNumber, otp);
  }

  /**
   * Get OTP status
   */
  async getOTPStatus(phoneNumber) {
    if (!this.otpService) {
      throw new Error('OTP service not initialized');
    }
    
    return await this.otpService.getOTPStatus(phoneNumber);
  }

  /**
   * Clean up expired OTPs
   */
  async cleanupExpiredOTPs() {
    if (!this.otpService) {
      throw new Error('OTP service not initialized');
    }
    
    return await this.otpService.cleanupExpiredOTPs();
  }

  /**
   * Health check
   */
  async healthCheck() {
    const baseHealth = await super.healthCheck();
    
    try {
      if (!this.otpService) {
        return {
          ...baseHealth,
          status: 'unhealthy',
          error: 'OTP service not initialized',
        };
      }
      
      // Test OTP service health
      const otpHealth = await this.otpService.healthCheck();
      
      return {
        ...baseHealth,
        provider: this.otpConfig.provider,
        features: {
          send: true,
          verify: true,
          cleanup: true,
          rateLimiting: true,
        },
        providerHealth: otpHealth,
      };
    } catch (error) {
      return {
        ...baseHealth,
        status: 'unhealthy',
        error: error.message,
      };
    }
  }
} 