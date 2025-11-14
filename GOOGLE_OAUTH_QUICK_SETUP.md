# Google OAuth Quick Setup Guide for Kasa Family Management

## Step 1: Create Web Application OAuth Client

**Important:** You need a **Web application** client, not a Desktop client!

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. If prompted, configure the OAuth consent screen first:
   - Choose **"External"** (unless you have Google Workspace)
   - Fill in:
     - App name: `Kasa Family Management`
     - User support email: Your email
     - Developer contact: Your email
   - Click **"Save and Continue"** through the steps
   - Add your email to **Test users** (if in testing mode)
   - Click **"Save and Continue"** → **"Back to Dashboard"**

6. Create OAuth Client:
   - **Application type**: Select **"Web application"** (NOT Desktop!)
   - **Name**: `Kasa Family Management Web`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://kasa-snowy-eight.vercel.app
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/google/callback
     https://kasa-snowy-eight.vercel.app/api/auth/google/callback
     ```
   - Click **"CREATE"**

7. **Copy your credentials:**
   - **Client ID**: Copy this (starts with numbers)
   - **Client Secret**: Click "Show" and copy it (starts with `GOCSPX-`)

## Step 2: Add to Vercel Environment Variables

1. Go to your Vercel project: https://vercel.com/your-project
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

   **For Production:**
   - **Key**: `GOOGLE_CLIENT_ID`
   - **Value**: `1069128847571-6fkfch43i617abqep32abd99v11teef9.apps.googleusercontent.com` (your actual Client ID)
   - **Environment**: Production, Preview, Development

   - **Key**: `GOOGLE_CLIENT_SECRET`
   - **Value**: Your Client Secret (the one starting with `GOCSPX-`)
   - **Environment**: Production, Preview, Development

   - **Key**: `GOOGLE_REDIRECT_URI`
   - **Value**: `https://kasa-snowy-eight.vercel.app/api/auth/google/callback`
   - **Environment**: Production

   - **Key**: `GOOGLE_REDIRECT_URI`
   - **Value**: `http://localhost:3000/api/auth/google/callback`
   - **Environment**: Development, Preview

4. Click **"Save"** for each variable
5. **Redeploy** your application for changes to take effect

## Step 3: Test

1. Go to your login page: `https://kasa-snowy-eight.vercel.app/login`
2. Click **"Sign in with Google"**
3. You should be redirected to Google's sign-in page
4. After signing in, you'll be redirected back and logged in

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the redirect URI in Vercel matches **exactly** what you configured in Google Cloud Console
- Check for trailing slashes, http vs https, etc.
- The redirect URI must be: `https://kasa-snowy-eight.vercel.app/api/auth/google/callback`

### "Invalid client" error
- Make sure you're using a **Web application** client, not Desktop
- Verify your Client ID and Client Secret are correct in Vercel
- Make sure you've redeployed after adding environment variables

### OAuth consent screen issues
- If your app is in "Testing" mode, add test users in the OAuth consent screen
- For production, you may need to submit for verification (or keep it in testing mode with test users)

## Current Status

✅ Google OAuth API routes created
✅ User schema updated to support Google OAuth
✅ Login page has "Sign in with Google" button
⏳ **Next:** Create Web application OAuth client and add credentials to Vercel

