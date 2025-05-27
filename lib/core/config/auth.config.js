/**
 * Authentication Configuration
 */

export const createAuthConfig = () => {
  return {
    // Session management
    session: {
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      cookieName: 'aeronotes-session',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    },
    
    // PIN configuration
    pin: {
      length: 4,
      attempts: {
        max: 5,
        lockoutMinutes: 30,
      },
      validation: {
        pattern: /^\d{4}$/,
        blockedPatterns: [
          '0000', '1111', '2222', '3333', '4444',
          '5555', '6666', '7777', '8888', '9999',
          '1234', '4321', '0123', '9876'
        ],
      },
    },
    
    // Phone number configuration
    phone: {
      format: 'E164', // +1234567890
      validation: {
        pattern: /^\+[1-9]\d{1,14}$/,
        minLength: 10,
        maxLength: 15,
      },
      normalization: {
        removeSpaces: true,
        removeHyphens: true,
        removeDots: true,
        addCountryCode: true,
        defaultCountryCode: '+1',
      },
    },
    
    // Rate limiting
    rateLimiting: {
      login: {
        maxAttempts: 10,
        windowMinutes: 30,
        blockMinutes: 60,
      },
      registration: {
        maxAttempts: 3,
        windowMinutes: 60,
        blockMinutes: 120,
      },
    },
    
    // Security
    security: {
      bcrypt: {
        saltRounds: 12,
      },
      jwt: {
        algorithm: 'HS256',
        expiresIn: '7d',
        issuer: 'aeronotes',
      },
      csrf: {
        enabled: true,
        tokenLength: 32,
      },
    },
    
    // Providers
    providers: {
      supabase: {
        enabled: true,
        config: {
          redirectTo: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        },
      },
    },
  };
}; 