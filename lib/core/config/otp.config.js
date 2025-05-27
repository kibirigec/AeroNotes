/**
 * OTP Configuration
 */

export const createOTPConfig = () => {
  const provider = process.env.OTP_PROVIDER || 'mock';
  
  return {
    // Provider selection
    provider,
    fallbackProvider: 'mock',
    
    // OTP settings
    otp: {
      length: 6,
      expiryMinutes: 10,
      format: 'numeric', // 'numeric', 'alphanumeric', 'alpha'
      caseInsensitive: true,
    },
    
    // Rate limiting
    rateLimiting: {
      maxAttempts: 5,
      windowMinutes: 15,
      cooldownMinutes: 5,
      dailyLimit: 10,
    },
    
    // Providers configuration
    providers: {
      mock: {
        enabled: true,
        config: {
          autoLog: true,
          simulateDelay: 1000,
          successRate: 1.0,
        },
      },
      twilio: {
        enabled: !!process.env.TWILIO_ACCOUNT_SID,
        config: {
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          fromPhoneNumber: process.env.TWILIO_FROM_PHONE_NUMBER,
          verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
          timeout: 30000,
          retryAttempts: 3,
        },
      },
      infobip: {
        enabled: !!process.env.INFOBIP_API_KEY,
        config: {
          apiKey: process.env.INFOBIP_API_KEY,
          baseUrl: process.env.INFOBIP_BASE_URL || 'https://api.infobip.com',
          applicationId: process.env.INFOBIP_APPLICATION_ID,
          messageId: process.env.INFOBIP_MESSAGE_ID,
          senderId: process.env.INFOBIP_SENDER_ID,
          timeout: 30000,
          retryAttempts: 3,
        },
      },
    },
    
    // Message templates
    templates: {
      default: {
        text: 'Your AeroNotes verification code is: {otp}. This code expires in {expiryMinutes} minutes.',
        sender: 'AeroNotes',
      },
      urgent: {
        text: 'URGENT: Your AeroNotes security code is: {otp}. Do not share this code.',
        sender: 'AeroNotes Security',
      },
    },
    
    // Storage configuration
    storage: {
      table: 'otp_codes',
      cleanupInterval: '*/5 * * * *', // Every 5 minutes
      retentionDays: 1,
      encryptCodes: true,
    },
    
    // Validation rules
    validation: {
      phoneNumber: {
        required: true,
        format: /^\+[1-9]\d{1,14}$/,
        blockedCountries: [], // ISO country codes
        allowedCountries: [], // Empty = all allowed
      },
      attempts: {
        maxPerPhone: 5,
        maxPerIP: 20,
        resetWindowHours: 24,
      },
    },
    
    // Monitoring and logging
    monitoring: {
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      trackDelivery: true,
      trackAttempts: true,
      alertOnFailure: process.env.NODE_ENV === 'production',
      metrics: {
        enabled: true,
        provider: 'console', // 'console', 'datadog', 'newrelic'
      },
    },
  };
}; 