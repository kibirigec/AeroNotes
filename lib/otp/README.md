# OTP Service Documentation

A flexible, pluggable OTP (One-Time Password) service that supports multiple SMS providers with easy configuration and provider switching.

## Architecture Overview

The OTP service follows a provider pattern architecture that allows for easy integration of different SMS/OTP service providers:

```
OTPService (Main Service)
├── BaseOTPProvider (Abstract Base Class)
├── MockOTPProvider (Development/Testing)
├── TwilioOTPProvider (Twilio SMS API)
├── InfobipOTPProvider (Infobip 2FA API)
└── [Future providers...]
```

## Features

- **Multiple Provider Support**: Mock, Twilio, Infobip (easily extensible)
- **Automatic Fallback**: Falls back to mock provider if configured provider fails
- **Database Storage**: Persistent OTP storage with Supabase
- **Configurable**: Environment variable based configuration
- **Validation**: Phone number and OTP format validation
- **Cleanup**: Automatic expired OTP cleanup
- **Logging**: Comprehensive logging for debugging
- **Type Safety**: Full TypeScript support (when using .ts files)

## Quick Start

### 1. Environment Variables

Set up your environment variables in `.env.local`:

```bash
# OTP Service Configuration
OTP_PROVIDER=mock  # Options: mock, twilio, infobip

# Twilio Configuration (if using Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_PHONE_NUMBER=+1234567890
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid  # Optional, for Verify API

# Infobip Configuration (if using Infobip)
INFOBIP_API_KEY=your_api_key
INFOBIP_BASE_URL=https://api.infobip.com
INFOBIP_APPLICATION_ID=your_application_id
INFOBIP_MESSAGE_ID=your_message_id
INFOBIP_SENDER_ID=your_sender_id
```

### 2. Database Setup

Run the migration to create the OTP codes table:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration manually
psql -f supabase/migrations/001_create_otp_codes_table.sql
```

### 3. Basic Usage

```javascript
import { OTPService } from './lib/otp/OTPService.js';
import { getOTPConfig } from './lib/otp/config.js';

// Initialize the service
const otpService = OTPService.getInstance();
const config = getOTPConfig();
await otpService.initialize(config);

// Send an OTP
const sendResult = await otpService.sendOTP('+1234567890', {
  length: 6,
  expiryMinutes: 5
});

if (sendResult.success) {
  console.log('OTP sent successfully');
  
  // Verify the OTP
  const verifyResult = await otpService.verifyOTP('+1234567890', '123456');
  
  if (verifyResult.success) {
    console.log('OTP verified successfully');
  }
}
```

## API Reference

### OTPService

#### `getInstance()`
Returns the singleton instance of the OTP service.

#### `initialize(config)`
Initializes the service with the provided configuration.

**Parameters:**
- `config`: Configuration object from `getOTPConfig()`

**Returns:** `{ success: boolean, error?: string, activeProvider?: string }`

#### `sendOTP(phoneNumber, options)`
Sends an OTP to the specified phone number.

**Parameters:**
- `phoneNumber`: E.164 formatted phone number (e.g., '+1234567890')
- `options`: Object with optional properties:
  - `length`: OTP length (default: 6)
  - `expiryMinutes`: Expiry time in minutes (default: 5)

**Returns:** `{ success: boolean, error?: string, messageId?: string, provider?: string }`

#### `verifyOTP(phoneNumber, otp)`
Verifies an OTP for the specified phone number.

**Parameters:**
- `phoneNumber`: E.164 formatted phone number
- `otp`: The OTP code to verify

**Returns:** `{ success: boolean, error?: string, verificationMethod?: string }`

#### `getStatus()`
Returns the current status of the service.

**Returns:** Object with service status information

#### `cleanup()`
Removes expired OTPs from the database.

### Configuration

#### `getOTPConfig()`
Returns the current OTP configuration based on environment variables.

#### `validateProviderConfig(config)`
Validates the provider configuration and returns any errors.

#### `getConfigSummary()`
Returns a summary of the current configuration for debugging.

## Provider Implementation

### Creating a New Provider

To add a new OTP provider, extend the `BaseOTPProvider` class:

```javascript
import { BaseOTPProvider } from '../BaseOTPProvider.js';

export class CustomOTPProvider extends BaseOTPProvider {
  constructor(config) {
    super();
    this.config = config;
  }

  async sendOTP(phoneNumber, otpCode, options = {}) {
    try {
      // Implement your SMS sending logic here
      const response = await yourSMSAPI.send({
        to: phoneNumber,
        message: `Your verification code is: ${otpCode}`
      });

      return {
        success: true,
        messageId: response.messageId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyOTP(phoneNumber, otpCode, messageId) {
    // Implement verification logic if your provider supports it
    // Return { success: false, error: 'Server-side verification not supported' }
    // if your provider doesn't support server-side verification
  }

  isConfigured() {
    return !!(this.config.apiKey && this.config.fromNumber);
  }

  getSupportedFeatures() {
    return {
      serverSideVerification: false,
      deliveryStatus: true
    };
  }

  getProviderInfo() {
    return {
      name: 'Custom Provider',
      configured: this.isConfigured(),
      features: this.getSupportedFeatures()
    };
  }
}
```

### Register Your Provider

Add your provider to the configuration in `lib/otp/config.js`:

```javascript
// In getOTPConfig function
if (hasCustomConfig()) {
  config.providers.custom = {
    apiKey: process.env.CUSTOM_API_KEY,
    fromNumber: process.env.CUSTOM_FROM_NUMBER
  };
}
```

## Provider Comparison

| Provider | Server Verification | Delivery Status | Cost | Setup Complexity |
|----------|-------------------|-----------------|------|------------------|
| Mock | ✅ | ❌ | Free | None |
| Twilio | ✅ (with Verify API) | ✅ | $$ | Medium |
| Infobip | ✅ | ✅ | $$ | Medium |

## Error Handling

The service provides comprehensive error handling:

```javascript
const result = await otpService.sendOTP('+1234567890');

if (!result.success) {
  switch (result.error) {
    case 'Invalid phone number format':
      // Handle invalid phone number
      break;
    case 'Provider not configured':
      // Handle configuration issues
      break;
    case 'Rate limit exceeded':
      // Handle rate limiting
      break;
    default:
      // Handle other errors
      console.error('OTP send failed:', result.error);
  }
}
```

## Testing

### Mock Provider

The mock provider is perfect for development and testing:

- Logs OTP codes to console instead of sending SMS
- Accepts any valid 6-digit code for verification
- Simulates network delays
- No external dependencies

### Running Examples

```bash
# Run the example file
node lib/otp/example.js
```

## Production Considerations

### Security

1. **Environment Variables**: Never commit API keys to version control
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Phone Number Validation**: Always validate phone numbers
4. **OTP Expiry**: Use short expiry times (5-10 minutes)
5. **Cleanup**: Regularly clean up expired OTPs

### Monitoring

1. **Logging**: Monitor OTP send/verify success rates
2. **Alerts**: Set up alerts for high failure rates
3. **Metrics**: Track provider performance and costs

### Scaling

1. **Database**: Consider partitioning the OTP table for high volume
2. **Caching**: Use Redis for high-frequency OTP operations
3. **Load Balancing**: Distribute across multiple provider accounts

## Troubleshooting

### Common Issues

1. **Provider not configured**: Check environment variables
2. **Invalid phone number**: Ensure E.164 format (+1234567890)
3. **OTP not received**: Check provider logs and delivery status
4. **Verification fails**: Check OTP expiry and format

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=otp:*
```

### Configuration Check

Use the configuration summary to debug setup issues:

```javascript
import { getConfigSummary } from './lib/otp/config.js';
console.log(JSON.stringify(getConfigSummary(), null, 2));
```

## Migration Guide

### From In-Memory Store

If migrating from an in-memory OTP store:

1. Run the database migration
2. Update API routes to use the new service
3. Update environment variables
4. Test with mock provider first
5. Switch to production provider

### Provider Migration

To switch providers:

1. Add new provider configuration
2. Test with new provider
3. Update `OTP_PROVIDER` environment variable
4. Monitor for issues
5. Remove old provider configuration

## Contributing

To contribute a new provider:

1. Extend `BaseOTPProvider`
2. Add configuration support
3. Add tests
4. Update documentation
5. Submit a pull request

## License

This OTP service is part of the AeroNotes project and follows the same license terms. 