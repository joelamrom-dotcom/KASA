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

## Email Configuration (Stored in Database)

**Note:** SMTP settings are stored in the database, not as environment variables!

To configure email settings:
1. Log into your application
2. Go to **Settings** page
3. Configure your email settings in the "Email Configuration" section
4. Enter your email address and password/app password
5. The system will use these settings for password reset emails

**No environment variables needed for email!** The email configuration is stored securely in the `EmailConfig` collection in your MongoDB database.

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

**Email Configuration:**
- Email settings are stored in the database (configure via Settings page)
- No environment variables needed for email!
- Password reset emails will work once you configure email settings in the app

**Stripe functionality is optional** and only needed if you're processing payments.

