import { OTPStorage } from './OTPStorage.js';
import { MockOTPProvider } from './providers/MockOTPProvider.js';
import { InfobipOTPProvider } from './providers/InfobipOTPProvider.js';
import { TwilioOTPProvider } from './providers/TwilioOTPProvider.js';

/**
 * OTP Service - Main service that manages OTP providers and operations
 * Provides a unified interface for sending and verifying OTPs
 */
export class OTPService {
  static instance = null;
  
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;
    this.initialized = false;
  }

  /**
   * Get singleton instance
   * @returns {OTPService}
   */
  static getInstance() {
    if (!OTPService.instance) {
      OTPService.instance = new OTPService();
    }
    return OTPService.instance;
  }

  /**
   * Initialize the OTP service with configuration
   * @param {Object} config - Configuration object
   * @param {string} config.provider - Active provider name ('mock', 'infobip', 'twilio')
   * @param {Object} config.providers - Provider-specific configurations
   */
  async initialize(config) {
    try {
      console.log('🔧 Initializing OTP Service...');
      
      // Register all available providers
      this.registerProviders(config.providers || {});
      
      // Set active provider
      await this.setActiveProvider(config.provider || 'mock');
      
      this.initialized = true;
      
      console.log(`✅ OTP Service initialized with provider: ${this.activeProvider?.getProviderName()}`);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to initialize OTP Service:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Register all available providers
   * @param {Object} providersConfig - Configuration for each provider
   */
  registerProviders(providersConfig) {
    // Register Mock Provider
    this.providers.set('mock', new MockOTPProvider(providersConfig.mock || {}));
    
    // Register Infobip Provider
    if (providersConfig.infobip) {
      this.providers.set('infobip', new InfobipOTPProvider(providersConfig.infobip));
    }
    
    // Register Twilio Provider
    if (providersConfig.twilio) {
      this.providers.set('twilio', new TwilioOTPProvider(providersConfig.twilio));
    }
    
    console.log(`📋 Registered ${this.providers.size} OTP providers:`, Array.from(this.providers.keys()));
  }

  /**
   * Set the active provider
   * @param {string} providerName - Name of the provider to activate
   */
  async setActiveProvider(providerName) {
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Provider '${providerName}' not found. Available: ${Array.from(this.providers.keys()).join(', ')}`);
    }
    
    if (!provider.isConfigured()) {
      console.warn(`⚠️ Provider '${providerName}' is not properly configured. Check your environment variables.`);
      
      // Fall back to mock if the requested provider isn't configured
      if (providerName !== 'mock') {
        console.log('🔄 Falling back to mock provider...');
        this.activeProvider = this.providers.get('mock');
        return;
      }
    }
    
    this.activeProvider = provider;
    console.log(`🎯 Active OTP provider set to: ${this.activeProvider.getProviderName()}`);
  }

  /**
   * Generate OTP code
   * @param {number} length - Length of the OTP (default: 4)
   * @returns {string}
   */
  generateOTP(length = 4) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  /**
   * Send OTP to a phone number
   * @param {string} phoneNumber - E.164 formatted phone number
   * @param {Object} options - Options for sending OTP
   * @param {number} options.length - OTP length (default: 4)
   * @param {number} options.expiryMinutes - Expiry time in minutes (default: 10)
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendOTP(phoneNumber, options = {}) {
    try {
      if (!this.initialized) {
        throw new Error('OTP Service not initialized. Call initialize() first.');
      }

      if (!this.activeProvider) {
        throw new Error('No active OTP provider configured.');
      }

      // Validate phone number format
      if (!phoneNumber || !/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
        return {
          success: false,
          error: 'Invalid phone number format. Must be in E.164 format (+1234567890)'
        };
      }

      const { length = 4, expiryMinutes = 10 } = options;
      
      // Generate OTP
      const otp = this.generateOTP(length);
      
      console.log(`📤 Sending OTP to ${phoneNumber} via ${this.activeProvider.getProviderName()}`);
      
      // Send via provider
      const sendResult = await this.activeProvider.sendOTP(phoneNumber, otp);
      
      if (!sendResult.success) {
        return sendResult;
      }
      
      // Store OTP in database
      const storeResult = await OTPStorage.storeOTP(
        phoneNumber, 
        otp, 
        expiryMinutes, 
        sendResult.messageId
      );
      
      if (!storeResult.success) {
        console.error('Failed to store OTP:', storeResult.error);
        return {
          success: false,
          error: 'Failed to store OTP for verification'
        };
      }
      
      console.log(`✅ OTP sent and stored successfully for ${phoneNumber}`);
      
      return {
        success: true,
        messageId: sendResult.messageId
      };
      
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify OTP code
   * @param {string} phoneNumber - E.164 formatted phone number
   * @param {string} otp - The OTP code to verify
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async verifyOTP(phoneNumber, otp) {
    try {
      if (!this.initialized) {
        throw new Error('OTP Service not initialized. Call initialize() first.');
      }

      // Validate inputs
      if (!phoneNumber || !otp) {
        return {
          success: false,
          error: 'Phone number and OTP code are required'
        };
      }

      if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      if (!/^\d{4,8}$/.test(otp)) {
        return {
          success: false,
          error: 'Invalid OTP format. Must be 4-8 digits.'
        };
      }

      console.log(`🔍 Verifying OTP for ${phoneNumber}`);
      
      // First, verify against our storage
      const storageResult = await OTPStorage.verifyOTP(phoneNumber, otp);
      
      if (!storageResult.success) {
        return storageResult;
      }
      
      // If provider supports server-side verification, also verify with provider
      if (this.activeProvider.getSupportedFeatures().serverSideVerification) {
        console.log('🔍 Performing additional server-side verification...');
        
        const providerResult = await this.activeProvider.verifyOTP(
          phoneNumber, 
          otp, 
          storageResult.messageId
        );
        
        if (!providerResult.success) {
          return providerResult;
        }
      }
      
      console.log(`✅ OTP verified successfully for ${phoneNumber}`);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get information about available providers
   * @returns {Array<Object>}
   */
  getProvidersInfo() {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      ...provider.getProviderInfo(),
      isActive: this.activeProvider === provider
    }));
  }

  /**
   * Get current service status
   * @returns {Object}
   */
  async getStatus() {
    const stats = await OTPStorage.getStats();
    
    return {
      initialized: this.initialized,
      activeProvider: this.activeProvider?.getProviderName() || 'none',
      providersCount: this.providers.size,
      storage: stats,
      providers: this.getProvidersInfo()
    };
  }

  /**
   * Clean up expired OTPs
   * @returns {Promise<void>}
   */
  async cleanup() {
    await OTPStorage.cleanupExpiredOTPs();
  }
} 