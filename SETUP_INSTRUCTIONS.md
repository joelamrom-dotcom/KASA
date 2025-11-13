# Setup Instructions for Kasa Family Management

Follow these steps to set up and run the Kasa Family Management application.

## Prerequisites

Before you begin, make sure you have:

- **Node.js** version 18 or higher installed
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`
- **npm** (comes with Node.js)
  - Verify installation: `npm --version`
- **MongoDB Database**
  - Option 1: MongoDB Atlas (Free cloud database) - https://www.mongodb.com/cloud/atlas
  - Option 2: Local MongoDB installation
- **Stripe Account** (Optional, for payment processing)
  - Sign up at: https://stripe.com

## Installation Steps

### 1. Extract/Clone the Project

If you received a ZIP file:
```bash
# Extract the ZIP file
# Navigate to the extracted folder
cd kasa-family-management
```

If you received a Git repository:
```bash
git clone <repository-url>
cd kasa-family-management
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages. It may take a few minutes.

### 3. Set Up Environment Variables

Create a file named `.env.local` in the `kasa-family-management` folder.

**Windows:**
```powershell
# In PowerShell, navigate to the project folder
cd kasa-family-management
New-Item -Path .env.local -ItemType File
```

**Mac/Linux:**
```bash
touch .env.local
```

Then add the following content to `.env.local`:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kasa-family-db?retryWrites=true&w=majority

# Stripe Configuration (Optional - for payment processing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
```

**How to get MongoDB URI:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password
7. Replace `<dbname>` with `kasa-family-db` (or your preferred name)

**How to get Stripe Keys:**
1. Go to https://dashboard.stripe.com
2. Sign up or log in
3. Go to Developers → API keys
4. Copy your test keys (starts with `pk_test_` and `sk_test_`)

### 4. Run the Development Server

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in Xs
```

### 5. Access the Application

Open your web browser and go to:
```
http://localhost:3000
```

## First Time Setup

1. **Add a Family**: Click "Add Family" to create your first family
2. **Configure Email** (Optional): Go to Settings → Email Configuration to set up email sending
3. **Add Payment Plans**: Go to Settings → Payment Plans to configure payment plans
4. **Add Event Types**: Go to Settings → Event Types to configure lifecycle events

## Production Build

To create a production build:

```bash
npm run build
npm start
```

The production server will run on port 3000.

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
# Windows: Find and stop the process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill
```

### MongoDB Connection Issues
- Check your MongoDB URI is correct
- Ensure your IP is whitelisted in MongoDB Atlas
- Verify your database password is correct

### Module Not Found Errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Stripe Errors
- Verify your Stripe keys are correct
- Make sure you're using test keys (starts with `pk_test_` and `sk_test_`)
- Check that environment variables are loaded (restart the server after adding them)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Features

- ✅ Family Management
- ✅ Member Tracking
- ✅ Payment Processing (Cash, Credit Card, Check, Quick Pay)
- ✅ Stripe Integration
- ✅ Statement Generation
- ✅ Email Sending
- ✅ Hebrew Date Support
- ✅ Payment Plans
- ✅ Lifecycle Events (Bar/Bat Mitzvah, Weddings)

## Support

If you encounter any issues:
1. Check the console for error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB is accessible
4. Check that Node.js version is 18+

## Next Steps

- Configure email settings in Settings → Email Configuration
- Add your first family
- Set up payment plans
- Configure event types

Enjoy using Kasa Family Management!

