# Vercel Environment Variables

Add these environment variables to your Vercel project settings:

## Required Variables

### Database
- **MONGODB_URI**
  - Description: MongoDB connection string
  - Example: `mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority`
  - Required: Yes

### Authentication
- **JWT_SECRET**
  - Description: Secret key for JWT token signing (use a strong random string)
  - Example: `your-super-secret-jwt-key-change-this-in-production`
  - Required: Yes
  - Note: Generate a secure random string (at least 32 characters)

### Application URL
- **NEXT_PUBLIC_BASE_URL**
  - Description: Your application's public URL (used for password reset links and API calls)
  - Example: `https://your-app.vercel.app`
  - Required: Yes
  - Note: Update this to your actual Vercel deployment URL

## Optional Variables (for email functionality)

### Email/SMTP Configuration
- **SMTP_HOST**
  - Description: SMTP server hostname
  - Example: `smtp.gmail.com`
  - Required: No (only if you want password reset emails)

- **SMTP_PORT**
  - Description: SMTP server port
  - Example: `587`
  - Required: No (defaults to 587)

- **SMTP_USER**
  - Description: SMTP username/email
  - Example: `your-email@gmail.com`
  - Required: No (only if you want password reset emails)

- **SMTP_PASS**
  - Description: SMTP password or app password
  - Example: `your-app-password`
  - Required: No (only if you want password reset emails)
  - Note: For Gmail, use an App Password, not your regular password

- **SMTP_FROM**
  - Description: Email address to send from
  - Example: `noreply@yourdomain.com`
  - Required: No (defaults to SMTP_USER)

## Optional Variables (for Stripe payments)

### Stripe Configuration
- **STRIPE_SECRET_KEY**
  - Description: Stripe secret key for server-side operations
  - Example: `sk_live_...` or `sk_test_...`
  - Required: No (only if using Stripe payments)

- **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
  - Description: Stripe publishable key for client-side
  - Example: `pk_live_...` or `pk_test_...`
  - Required: No (only if using Stripe payments)

## How to Add to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `MONGODB_URI`)
   - **Value**: Variable value
   - **Environment**: Select which environments (Production, Preview, Development)
4. Click **Save**
5. Redeploy your application for changes to take effect

## Minimum Required Setup

For basic functionality, you need at minimum:
- `MONGODB_URI`
- `JWT_SECRET`
- `NEXT_PUBLIC_BASE_URL`

Email functionality will work without SMTP variables (it will log reset URLs to console in development mode).

Stripe functionality is optional and only needed if you're processing payments.

