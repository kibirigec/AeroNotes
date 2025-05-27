/**
 * Example usage of the OTP Service
 * This file demonstrates how to use the OTP service with different providers
 */

import { OTPService } from './OTPService.js';
import { getOTPConfig, getConfigSummary, validateProviderConfig } from './config.js';

async function exampleUsage() {
  console.log('=== OTP Service Example ===\n');

  try {
    // 1. Get configuration
    console.log('1. Getting OTP configuration...');
    const config = getOTPConfig();
    console.log('Active provider:', config.activeProvider);
    console.log('Available providers:', config.availableProviders);
    
    // 2. Validate configuration
    console.log('\n2. Validating configuration...');
    const validation = validateProviderConfig(config);
    if (validation.errors.length > 0) {
      console.warn('Configuration warnings:', validation.errors);
    }
    
    // 3. Get configuration summary
    console.log('\n3. Configuration summary:');
    const summary = getConfigSummary();
    console.log(JSON.stringify(summary, null, 2));

    // 4. Initialize OTP service
    console.log('\n4. Initializing OTP service...');
    const otpService = OTPService.getInstance();
    const initResult = await otpService.initialize(config);
    
    if (!initResult.success) {
      throw new Error(`Failed to initialize OTP service: ${initResult.error}`);
    }
    
    console.log('✅ OTP service initialized successfully');
    console.log('Active provider:', initResult.activeProvider);

    // 5. Get service status
    console.log('\n5. Service status:');
    const status = otpService.getStatus();
    console.log(JSON.stringify(status, null, 2));

    // 6. Send OTP example
    console.log('\n6. Sending OTP example...');
    const phoneNumber = '+1234567890'; // Example phone number
    
    const sendResult = await otpService.sendOTP(phoneNumber, {
      length: 6,
      expiryMinutes: 5
    });
    
    if (sendResult.success) {
      console.log('✅ OTP sent successfully');
      console.log('Message ID:', sendResult.messageId);
      console.log('Provider used:', sendResult.provider);
      
      // In development with mock provider, the OTP is logged to console
      if (config.activeProvider === 'mock') {
        console.log('📱 Check console for OTP code (mock provider)');
      }
      
      // 7. Verify OTP example (using a mock OTP for demonstration)
      console.log('\n7. Verifying OTP example...');
      
      // For mock provider, we can use any 6-digit code since it accepts all valid formats
      const mockOTP = config.activeProvider === 'mock' ? '123456' : 'REPLACE_WITH_ACTUAL_OTP';
      
      const verifyResult = await otpService.verifyOTP(phoneNumber, mockOTP);
      
      if (verifyResult.success) {
        console.log('✅ OTP verified successfully');
        console.log('Verification method:', verifyResult.verificationMethod);
      } else {
        console.log('❌ OTP verification failed:', verifyResult.error);
      }
      
    } else {
      console.log('❌ Failed to send OTP:', sendResult.error);
    }

    // 8. Provider information
    console.log('\n8. Provider information:');
    const providersInfo = otpService.getProvidersInfo();
    console.log(JSON.stringify(providersInfo, null, 2));

    // 9. Cleanup expired OTPs
    console.log('\n9. Cleaning up expired OTPs...');
    await otpService.cleanup();
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Example failed:', error.message);
    console.error(error.stack);
  }
}

// Example of switching providers at runtime
async function switchProviderExample() {
  console.log('\n=== Provider Switching Example ===\n');
  
  try {
    const otpService = OTPService.getInstance();
    
    // Get current status
    let status = otpService.getStatus();
    console.log('Current provider:', status.activeProvider);
    
    // Try to switch to a different provider
    const availableProviders = ['mock', 'twilio', 'infobip'];
    const currentProvider = status.activeProvider;
    const nextProvider = availableProviders.find(p => p !== currentProvider);
    
    if (nextProvider) {
      console.log(`Attempting to switch from ${currentProvider} to ${nextProvider}...`);
      
      const switchResult = await otpService.setActiveProvider(nextProvider);
      if (switchResult.success) {
        console.log(`✅ Successfully switched to ${nextProvider}`);
      } else {
        console.log(`❌ Failed to switch to ${nextProvider}: ${switchResult.error}`);
        console.log(`Fallback provider: ${switchResult.fallbackProvider}`);
      }
    } else {
      console.log('No alternative providers available for switching');
    }
    
  } catch (error) {
    console.error('❌ Provider switching example failed:', error.message);
  }
}

// Example of error handling
async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===\n');
  
  try {
    const otpService = OTPService.getInstance();
    
    // Test with invalid phone number
    console.log('Testing with invalid phone number...');
    const invalidResult = await otpService.sendOTP('invalid-phone', { length: 6 });
    console.log('Invalid phone result:', invalidResult);
    
    // Test with invalid OTP
    console.log('\nTesting with invalid OTP...');
    const invalidOTPResult = await otpService.verifyOTP('+1234567890', 'invalid');
    console.log('Invalid OTP result:', invalidOTPResult);
    
    // Test with expired OTP (this would require waiting or manipulating the database)
    console.log('\nNote: Expired OTP testing requires time manipulation or database access');
    
  } catch (error) {
    console.error('❌ Error handling example failed:', error.message);
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    await exampleUsage();
    await switchProviderExample();
    await errorHandlingExample();
  })();
}

export {
  exampleUsage,
  switchProviderExample,
  errorHandlingExample
}; 