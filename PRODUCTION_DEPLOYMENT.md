# AeroNotes Production Deployment Guide

## 🚀 Quick Start

This guide will help you deploy AeroNotes to production safely and efficiently.

### Prerequisites

- Node.js 18+ installed
- Supabase account and project set up
- Twilio account for OTP services
- Domain name and SSL certificate
- Production hosting environment (Vercel, AWS, etc.)

## 📋 Pre-Deployment Steps

### 1. Run Production Readiness Check

```bash
npm run prepare-production
```

This will scan your codebase for:
- Console.log statements that need replacement
- TODO comments that should be resolved
- Hardcoded localhost URLs
- Missing environment files
- Missing production scripts

### 2. Fix Console.log Statements

```bash
npm run fix-console-logs
```

This automatically replaces `console.log` with proper logging using the Logger utility.

**⚠️ Important:** Review the changes and adjust log levels as needed:
- `Logger.debug()` - Development debugging (won't show in production)
- `Logger.info()` - General information
- `Logger.warn()` - Warning messages
- `Logger.error()` - Error messages
- `Logger.audit()` - Security/audit events
- `Logger.security()` - Security-related events

### 3. Environment Configuration

1. Copy the production environment template:
   ```bash
   cp .env.production.example .env.production
   ```

2. Fill in all required values in `.env.production`:
   - Generate strong secrets for JWT_SECRET and APP_SECRET
   - Configure Supabase credentials
   - Set up Twilio for OTP
   - Configure your production domain

3. **Never commit `.env.production` to version control!**

### 4. Security Configuration

Ensure these security settings are properly configured:

```env
# Strong secrets (use openssl rand -hex 32)
JWT_SECRET=your-super-strong-jwt-secret
APP_SECRET=your-super-strong-app-secret
NEXTAUTH_SECRET=your-super-strong-nextauth-secret

# Production domain
NEXT_PUBLIC_APP_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com

# Security settings
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=900000
SESSION_TIMEOUT=3600000

# Rate limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000
```

## 🏗️ Deployment Options

### Option 1: Netlify (Recommended)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Connect to Netlify:**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Choose your repository
   - Configure build settings:
     - **Build command:** `npm run build`
     - **Publish directory:** `.next`
     - **Node version:** `18`

3. **Configure Environment Variables:**
   - In Netlify dashboard: Site settings → Environment variables
   - Add all variables from `.env.production`
   - See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for detailed guide

**Alternative: Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Option 2: Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables:**
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add all environment variables from `.env.production`

### Option 3: Docker Deployment

1. **Build Docker image:**
   ```bash
   docker build -t aeronotes .
   ```

2. **Run container:**
   ```bash
   docker run -p 3000:3000 --env-file .env.production aeronotes
   ```

### Option 4: Traditional Server

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   NODE_ENV=production npm start
   ```

## 🔧 Post-Deployment Configuration

### 1. Database Setup

Ensure your Supabase database has all required tables and policies:

```sql
-- Run these in your Supabase SQL editor
-- (These should already be set up from development)

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Verify policies are in place
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 2. SSL/TLS Configuration

- Ensure your domain has a valid SSL certificate
- Configure HTTPS redirects
- Set up HSTS headers (handled by the security middleware)

### 3. Monitoring Setup

1. **Configure logging service** (if using external logging):
   ```env
   LOG_SERVICE=datadog  # or 'cloudwatch', 'loggly'
   LOG_SERVICE_API_KEY=your-api-key
   ```

2. **Set up error tracking** (Sentry):
   ```env
   SENTRY_DSN=your-sentry-dsn
   ```

3. **Configure analytics** (if needed):
   ```env
   ANALYTICS_ID=your-analytics-id
   ```

## 🧪 Production Testing

### 1. Smoke Tests

After deployment, test these critical paths:

- [ ] User registration with OTP
- [ ] User login/logout
- [ ] Note creation and editing
- [ ] File uploads
- [ ] Search functionality
- [ ] Settings/preferences
- [ ] Account deletion

### 2. Security Tests

- [ ] Test rate limiting
- [ ] Verify HTTPS redirects
- [ ] Check security headers
- [ ] Test authentication flows
- [ ] Verify data encryption

### 3. Performance Tests

- [ ] Page load times
- [ ] API response times
- [ ] File upload performance
- [ ] Search performance

## 📊 Monitoring and Maintenance

### Daily Checks

- [ ] Check application logs for errors
- [ ] Monitor response times
- [ ] Verify backup systems
- [ ] Check SSL certificate status

### Weekly Checks

- [ ] Review security logs
- [ ] Check database performance
- [ ] Monitor storage usage
- [ ] Review user feedback

### Monthly Checks

- [ ] Security audit
- [ ] Performance optimization
- [ ] Dependency updates
- [ ] Backup restoration test

## 🚨 Emergency Procedures

### Application Down

1. Check hosting provider status
2. Review recent deployments
3. Check database connectivity
4. Review application logs
5. Rollback if necessary

### Security Incident

1. Immediately rotate all secrets
2. Review access logs
3. Notify affected users
4. Document incident
5. Implement additional security measures

### Data Issues

1. Stop write operations if necessary
2. Assess data integrity
3. Restore from backup if needed
4. Verify data consistency
5. Resume operations

## 📞 Emergency Contacts

- **Production Issues:** [Your DevOps Team]
- **Security Incidents:** [Your Security Team]
- **Database Issues:** [Your DBA/Supabase Support]
- **Hosting Provider:** [Your Hosting Support]

## 🔄 Rollback Procedure

If you need to rollback a deployment:

### Vercel
```bash
vercel rollback [deployment-url]
```

### Docker
```bash
docker stop aeronotes
docker run -p 3000:3000 --env-file .env.production aeronotes:previous-tag
```

### Traditional Server
```bash
git checkout previous-stable-commit
npm run build
pm2 restart aeronotes
```

## 📚 Additional Resources

- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Detailed checklist
- [.env.production.example](./.env.production.example) - Environment template
- [lib/core/config/logging.config.js](./lib/core/config/logging.config.js) - Logging configuration
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**⚠️ Remember:** Never deploy to production without completing the production checklist and thoroughly testing in a staging environment first! 