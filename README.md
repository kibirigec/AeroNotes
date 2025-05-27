# AeroNotes 

A modern notes application built with Next.js, featuring secure phone-based authentication and a robust OTP (One-Time Password) service.

## 🚀 Features

- **Phone-Based Authentication**: Secure login system using phone numbers and PINs
- **OTP Verification**: Multi-provider OTP service with SMS integration
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Database Integration**: Supabase backend with PostgreSQL
- **Real-Time**: Live updates and synchronization
- **Secure**: PIN-based authentication with bcrypt hashing

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Custom phone + PIN system
- **OTP Service**: Multi-provider (Mock, Twilio, Infobip)
- **Styling**: Tailwind CSS with custom components

## 🔐 OTP Service Implementation

This project features a comprehensive OTP service with pluggable provider architecture:

### Architecture Overview
```
OTPService (Main Service)
├── BaseOTPProvider (Abstract Base Class)
├── MockOTPProvider (Development/Testing)
├── TwilioOTPProvider (Twilio SMS API)
├── InfobipOTPProvider (Infobip 2FA API)
└── [Future providers...]
```

### Key Features
- **Multiple Provider Support**: Mock, Twilio, Infobip
- **Automatic Fallback**: Falls back to mock provider if configured provider fails
- **Database Storage**: Persistent OTP storage with automatic cleanup
- **Phone Validation**: E.164 format validation
- **Rate Limiting**: Database-level constraints to prevent abuse
- **Comprehensive Logging**: Full audit trail for debugging

### Provider Configuration

Add these environment variables to `.env.local`:

```bash
# OTP Service Configuration
OTP_PROVIDER=mock  # Options: mock, twilio, infobip

# Twilio Configuration (optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_PHONE_NUMBER=+1234567890
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid

# Infobip Configuration (optional)
INFOBIP_API_KEY=your_api_key
INFOBIP_BASE_URL=https://api.infobip.com
INFOBIP_APPLICATION_ID=your_application_id
INFOBIP_MESSAGE_ID=your_message_id
INFOBIP_SENDER_ID=your_sender_id
```

## 📁 Project Structure

```
aeronotes/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── send-otp/
│   │   │       ├── verify-otp-and-signup/
│   │   │       └── login-with-pin/
│   │   ├── components/
│   │   └── globals.css
├── lib/
│   ├── otp/
│   │   ├── OTPService.js          # Main OTP service
│   │   ├── BaseOTPProvider.js     # Abstract base class
│   │   ├── OTPStorage.js          # Database storage layer
│   │   ├── config.js              # Configuration management
│   │   └── providers/
│   │       ├── MockOTPProvider.js
│   │       ├── TwilioOTPProvider.js
│   │       └── InfobipOTPProvider.js
│   └── supabaseAdmin.js
├── scripts/
│   ├── create-otp-table.js              # Database setup script
│   ├── setup-otp-database.sql           # Manual SQL setup
│   ├── fix-storage-policies.sql         # Original storage fix (may have permission issues)
│   ├── fix-storage-policies-supabase.sql # Advanced storage fix for Supabase
│   └── simple-storage-fix.sql           # Simple storage fix (recommended)
└── supabase/
    └── migrations/
        └── 20250527215558_create_otp_codes_table.sql
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account
- SMS provider account (Twilio or Infobip) for production

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd aeronotes
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Copy `.env.local.example` to `.env.local` and configure:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Required variables:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # App Security
   APP_SECRET=your_strong_app_secret
   
   # OTP Configuration
   OTP_PROVIDER=mock  # Start with mock for development
   ```

4. **Set up the database**
   
   **Option A: Manual Setup (Recommended)**
   1. Go to your Supabase dashboard
   2. Navigate to SQL Editor
   3. Copy and paste the contents of `scripts/setup-otp-database.sql`
   4. Click "Run"
   
   **Option B: Using Migration**
   ```bash
   npx supabase db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   
   Visit [http://localhost:3000](http://localhost:3000) in your browser

## 🔧 Development

### Testing OTP Service

The project includes a mock OTP provider perfect for development:

```javascript
// Mock provider automatically logs OTPs to console
// Set OTP_PROVIDER=mock in your .env.local

// Example console output:
// ============================================================
// 📱 MOCK OTP PROVIDER - SMS SIMULATION
// ============================================================
// 📞 To: +1234567890
// 🔐 OTP Code: 123456
// 📨 Message ID: mock_1234567890_abc123
// ⏰ Timestamp: 2024-01-01T12:00:00.000Z
// ============================================================
// 💡 This is a mock - no actual SMS was sent!
```

### Running Examples

Test the OTP service directly:

```bash
node lib/otp/example.js
```

### Database Management

Clean up expired OTPs:
```bash
# Via Supabase SQL Editor
SELECT cleanup_expired_otps();
```

## 🚀 Production Deployment

### Environment Setup

1. **Choose your SMS provider**
   - **Twilio**: Great for US/global coverage
   - **Infobip**: Excellent for Europe/global

2. **Configure environment variables**
   ```bash
   OTP_PROVIDER=twilio  # or infobip
   
   # Add your provider credentials
   TWILIO_ACCOUNT_SID=your_actual_sid
   TWILIO_AUTH_TOKEN=your_actual_token
   TWILIO_FROM_PHONE_NUMBER=+1234567890
   ```

3. **Test thoroughly**
   - Start with mock provider
   - Test with real phone numbers
   - Monitor delivery rates

### Deploy to Vercel

1. **Connect your repository to Vercel**
2. **Configure environment variables in Vercel dashboard**
3. **Deploy**
   ```bash
   npm run build
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "phoneNumber": "+1234567890"
}
```

Response:
```json
{
  "message": "OTP sent successfully",
  "provider": "mock"
}
```

#### Verify OTP and Sign Up
```http
POST /api/auth/verify-otp-and-signup
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "otp": "123456",
  "pin": "1234"
}
```

#### Login with PIN
```http
POST /api/auth/login-with-pin
Content-Type: application/json

{
  "lastFourDigits": "7890",
  "pin": "1234"
}
```

### File Storage

Files are organized in user-specific folders within buckets:
- **Images**: `images/{user_id}/filename.jpg`
- **Documents**: `aeronotes-documents/{user_id}/filename.pdf`

This structure ensures proper access control via Row Level Security policies.

## 🔍 Troubleshooting

### Common Issues

1. **OTP not received**
   - Check provider configuration
   - Verify phone number format (E.164: +1234567890)
   - Check provider account balance/limits

2. **Database connection issues**
   - Verify Supabase credentials
   - Check if OTP table exists
   - Run database setup script

3. **Storage policy violations (file upload errors)**
   - Run the storage policy fix script
   - Ensure files are organized in user-specific folders
   - Check authentication status before upload
   
   **Fix storage policies:**
   
   **Option A: Simple Fix (Recommended)**
   1. Go to Supabase dashboard → SQL Editor
   2. Copy and paste the contents of `scripts/simple-storage-fix.sql`
   3. Click "Run"
   
   **Option B: If you get "must be owner" error**
   1. Use the Supabase Dashboard → Storage → Policies
   2. Manually create policies using the UI instead of SQL
   3. Or contact Supabase support for elevated permissions
   
   **Option C: Comprehensive Fix (Advanced)**
   1. Use `scripts/fix-storage-policies-supabase.sql`
   2. This may require admin permissions or service role access

4. **Provider configuration**
   ```javascript
   import { getConfigSummary } from './lib/otp/config.js';
   console.log(JSON.stringify(getConfigSummary(), null, 2));
   ```

### Debug Mode

Enable detailed logging:
```bash
DEBUG=otp:* npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

### Adding New OTP Providers

1. Extend `BaseOTPProvider` class
2. Implement required methods
3. Add configuration support
4. Update documentation
5. Add tests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Twilio API Documentation](https://www.twilio.com/docs)
- [Infobip API Documentation](https://www.infobip.com/docs)

## 📞 Support

For support and questions:
- Create an issue in this repository
- Check the [OTP Service README](lib/otp/README.md) for detailed documentation
- Review the troubleshooting section above

---

Built with ❤️ using Next.js and Supabase