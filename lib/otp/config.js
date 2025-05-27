/**
 * OTP Service Configuration
 * Reads environment variables and provides configuration for OTP providers
 */

/**
 * Get OTP service configuration from environment variables
 * @returns {Object} Configuration object for OTP service
 */
export function getOTPConfig() {
  // Determine which provider to use
  const provider = process.env.OTP_PROVIDER || 'mock';
  
  // Base configuration
  const config = {
    provider: provider,
    providers: {}
  };

  // Mock provider configuration (always available)
  config.providers.mock = {
    simulateFailures: process.env.OTP_MOCK_SIMULATE_FAILURES === 'true'
  };

  // Infobip provider configuration
  if (hasInfobipConfig()) {
    config.providers.infobip = {
      baseUrl: process.env.INFOBIP_BASE_URL,
      apiKey: process.env.INFOBIP_API_KEY,
      applicationId: process.env.INFOBIP_2FA_APPLICATION_ID,
      messageId: process.env.INFOBIP_2FA_MESSAGE_ID,
      senderId: process.env.INFOBIP_SENDER_ID || 'ServiceSMS'
    };
  }

  // Twilio provider configuration
  if (hasTwilioConfig()) {
    config.providers.twilio = {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromPhoneNumber: process.env.TWILIO_FROM_PHONE_NUMBER,
      serviceSid: process.env.TWILIO_VERIFY_SERVICE_SID // Optional: for Verify API
    };
  }

  return config;
}

/**
 * Check if Infobip configuration is available
 * @returns {boolean}
 */
export function hasInfobipConfig() {
  return !!(
    process.env.INFOBIP_BASE_URL &&
    process.env.INFOBIP_API_KEY &&
    process.env.INFOBIP_2FA_APPLICATION_ID &&
    process.env.INFOBIP_2FA_MESSAGE_ID
  );
}

/**
 * Check if Twilio configuration is available
 * @returns {boolean}
 */
export function hasTwilioConfig() {
  const hasBasic = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN
  );
  
  const hasSMS = !!process.env.TWILIO_FROM_PHONE_NUMBER;
  const hasVerify = !!process.env.TWILIO_VERIFY_SERVICE_SID;
  
  return hasBasic && (hasSMS || hasVerify);
}

/**
 * Get available providers based on configuration
 * @returns {Array<string>}
 */
export function getAvailableProviders() {
  const providers = ['mock']; // Mock is always available
  
  if (hasInfobipConfig()) {
    providers.push('infobip');
  }
  
  if (hasTwilioConfig()) {
    providers.push('twilio');
  }
  
  return providers;
}

/**
 * Validate provider configuration
 * @param {string} providerName - Name of the provider to validate
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export function validateProviderConfig(providerName) {
  const errors = [];
  
  switch (providerName) {
    case 'mock':
      // Mock provider is always valid
      break;
      
    case 'infobip':
      if (!process.env.INFOBIP_BASE_URL) errors.push('INFOBIP_BASE_URL is required');
      if (!process.env.INFOBIP_API_KEY) errors.push('INFOBIP_API_KEY is required');
      if (!process.env.INFOBIP_2FA_APPLICATION_ID) errors.push('INFOBIP_2FA_APPLICATION_ID is required');
      if (!process.env.INFOBIP_2FA_MESSAGE_ID) errors.push('INFOBIP_2FA_MESSAGE_ID is required');
      break;
      
    case 'twilio':
      if (!process.env.TWILIO_ACCOUNT_SID) errors.push('TWILIO_ACCOUNT_SID is required');
      if (!process.env.TWILIO_AUTH_TOKEN) errors.push('TWILIO_AUTH_TOKEN is required');
      
      const hasSMS = !!process.env.TWILIO_FROM_PHONE_NUMBER;
      const hasVerify = !!process.env.TWILIO_VERIFY_SERVICE_SID;
      
      if (!hasSMS && !hasVerify) {
        errors.push('Either TWILIO_FROM_PHONE_NUMBER (for SMS API) or TWILIO_VERIFY_SERVICE_SID (for Verify API) is required');
      }
      break;
      
    default:
      errors.push(`Unknown provider: ${providerName}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get configuration summary for debugging
 * @returns {Object}
 */
export function getConfigSummary() {
  const config = getOTPConfig();
  const availableProviders = getAvailableProviders();
  
  return {
    activeProvider: config.provider,
    availableProviders,
    configured: {
      mock: true, // Always true
      infobip: hasInfobipConfig(),
      twilio: hasTwilioConfig()
    },
    validation: {
      mock: validateProviderConfig('mock'),
      infobip: hasInfobipConfig() ? validateProviderConfig('infobip') : { valid: false, errors: ['Not configured'] },
      twilio: hasTwilioConfig() ? validateProviderConfig('twilio') : { valid: false, errors: ['Not configured'] }
    }
  };
}

/**
 * Get suggested environment variables for a provider
 * @param {string} providerName - Provider name
 * @returns {Array<{key: string, description: string, required: boolean}>}
 */
export function getProviderEnvVars(providerName) {
  switch (providerName) {
    case 'mock':
      return [
        {
          key: 'OTP_PROVIDER',
          description: 'Set to "mock" to use mock provider',
          required: false
        },
        {
          key: 'OTP_MOCK_SIMULATE_FAILURES',
          description: 'Set to "true" to simulate occasional failures (for testing)',
          required: false
        }
      ];
      
    case 'infobip':
      return [
        {
          key: 'OTP_PROVIDER',
          description: 'Set to "infobip" to use Infobip provider',
          required: false
        },
        {
          key: 'INFOBIP_BASE_URL',
          description: 'Your Infobip API base URL (e.g., https://xxxxx.api.infobip.com)',
          required: true
        },
        {
          key: 'INFOBIP_API_KEY',
          description: 'Your Infobip API key',
          required: true
        },
        {
          key: 'INFOBIP_2FA_APPLICATION_ID',
          description: 'Infobip 2FA application ID',
          required: true
        },
        {
          key: 'INFOBIP_2FA_MESSAGE_ID',
          description: 'Infobip 2FA message template ID',
          required: true
        },
        {
          key: 'INFOBIP_SENDER_ID',
          description: 'Sender ID for SMS (default: ServiceSMS)',
          required: false
        }
      ];
      
    case 'twilio':
      return [
        {
          key: 'OTP_PROVIDER',
          description: 'Set to "twilio" to use Twilio provider',
          required: false
        },
        {
          key: 'TWILIO_ACCOUNT_SID',
          description: 'Your Twilio Account SID',
          required: true
        },
        {
          key: 'TWILIO_AUTH_TOKEN',
          description: 'Your Twilio Auth Token',
          required: true
        },
        {
          key: 'TWILIO_FROM_PHONE_NUMBER',
          description: 'Phone number to send SMS from (required for SMS API)',
          required: false
        },
        {
          key: 'TWILIO_VERIFY_SERVICE_SID',
          description: 'Twilio Verify Service SID (required for Verify API)',
          required: false
        }
      ];
      
    default:
      return [];
  }
} 