# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your AI SaaS Platform.

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" (unless you have a Google Workspace)
     - Fill in the required information
     - Add your email to test users
   - Application type: **Web application**
   - Name: "AI SaaS Platform" (or your preferred name)
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)
   - Click "Create"
5. Copy your **Client ID** and **Client Secret**

## Step 2: Configure Environment Variables

Create a `.env.local` file in your project root (or add to your existing `.env` file):

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Base URL (update for production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

**Important:** Never commit `.env.local` to version control. It's already in `.gitignore`.

## Step 3: Restart Your Development Server

After adding the environment variables, restart your Next.js development server:

```bash
npm run dev
```

## Step 4: Test Google OAuth

1. Navigate to `http://localhost:3000/login`
2. Click the "Sign in with Google" button
3. You should be redirected to Google's sign-in page
4. After signing in, you'll be redirected back to your app
5装在. The user will be automatically created if they don't exist

## How It Works

1. **User clicks "Sign in with Google"** → Redirects to `/api/auth/google`
2. **OAuth initiation** → User is redirected to Google's consent screen
3. **User grants permission** → Google redirects back with an authorization code
4. **Callback handler** → `/api/auth/google/callback` exchanges the code for tokens
5. **User info retrieval** → Fetches user profile from Google
6. **User creation/login** → Creates new user or logs in existing user
7. **Session creation** → Creates a session and stores user data
8. **Redirect to dashboard** → User is logged in and redirected

## Features

- ✅ Automatic user creation for new Google users
- ✅ Seamless login for existing users
- ✅ CSRF protection using state parameter
- ✅ Secure session management
- ✅ Activity logging for all authentication events
- ✅ Profile picture support (stored from Google)

## Troubleshooting

### "Google OAuth not configured" error
- Make sure you've added `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to your `.env.local` file
- Restart your development server after adding environment variables

### "Redirect URI mismatch" error
- Make sure the redirect URI in your `.env.local` matches exactly what you configured in Google Cloud Console
- Check that the URI includes the correct protocol (`http://` for localhost, `https://` for production)

### "Invalid state parameter" error
- This is a CSRF protection mechanism
- Make sure cookies are enabled in your browser
- Clear cookies and try again

### User not being created
- Check your database connection
- Review server logs for errors
- Make sure the `users` collection exists

## Production Deployment

For production:

1. Update your `.env` file with production values:
   ```env
   GOOGLE_CLIENT_ID=your_production_client_id
   GOOGLE_CLIENT_SECRET=your_production_client_secret
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   NODE_ENV=production
   ```

2. Add the production redirect URI to Google Cloud Console

3. Make sure your OAuth consent screen is published (if using external users)

4. Enable HTTPS for secure cookie transmission

## Security Notes

- The `oauth_state` cookie is httpOnly and secure in production
- User passwords are not required for OAuth users (set to `null`)
- Session tokens are randomly generated and stored securely
- All authentication events are logged for audit purposes

