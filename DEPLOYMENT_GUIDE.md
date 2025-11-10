# Deployment Guide - Kasa Family Management

This guide will help you share your app with others. Choose the method that works best for you.

## Option 1: Deploy to Vercel (Recommended - Free & Easy)

Vercel is the easiest way to deploy Next.js apps. Your app will be accessible via a public URL.

### Steps:

1. **Create a Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub, GitLab, or email

2. **Install Vercel CLI** (optional, but recommended)
   ```bash
   npm install -g vercel
   ```

3. **Deploy from Command Line**
   ```bash
   cd kasa-family-management
   vercel
   ```
   - Follow the prompts
   - When asked, say "Yes" to link to existing project or create new
   - Your app will be deployed and you'll get a URL like: `https://your-app.vercel.app`

4. **Set Environment Variables in Vercel Dashboard**
   - Go to your project settings → Environment Variables
   - Add these variables:
     - `MONGODB_URI` - Your MongoDB connection string
     - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
     - `STRIPE_SECRET_KEY` - Your Stripe secret key
   - Redeploy after adding variables

5. **Share the URL** - Anyone can now access your app!

### Benefits:
- ✅ Free hosting
- ✅ Automatic HTTPS
- ✅ Easy updates (just push to Git or run `vercel --prod`)
- ✅ Custom domain support

---

## Option 2: Share via Git Repository

Share your code so others can run it locally.

### Steps:

1. **Create a GitHub Repository**
   - Go to https://github.com/new
   - Create a new repository
   - Don't initialize with README (you already have one)

2. **Push Your Code**
   ```bash
   cd kasa-family-management
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

3. **Create a Setup Guide** (see SETUP_INSTRUCTIONS.md below)

4. **Share the Repository URL** - Others can clone and run it

---

## Option 3: Create a Deployment Package

Package your app to send as a ZIP file.

### Steps:

1. **Create a Clean Package** (excludes node_modules and sensitive files)
   ```bash
   cd kasa-family-management
   # Create a zip excluding node_modules and .env files
   # On Windows PowerShell:
   Compress-Archive -Path * -DestinationPath ../kasa-app.zip -Exclude node_modules,.next,.env*
   ```

2. **Create Setup Instructions** (see below)

3. **Send the ZIP file** along with setup instructions

---

## Option 4: Deploy to Other Platforms

### Netlify
- Similar to Vercel
- Go to https://netlify.com
- Drag and drop your `kasa-family-management` folder (after `npm run build`)
- Or connect via Git

### Railway
- Go to https://railway.app
- Connect your Git repository
- Add environment variables
- Deploy automatically

### Heroku
- Requires a `Procfile` (we can create one)
- More complex setup
- Paid plans available

---

## Setup Instructions for Recipients

If someone receives your app, they'll need these instructions:

### Prerequisites:
- Node.js 18+ installed
- MongoDB database (or MongoDB Atlas account)
- (Optional) Stripe account for payments

### Installation Steps:

1. **Extract/Clone the Project**
   ```bash
   # If received as ZIP:
   unzip kasa-app.zip
   cd kasa-family-management
   
   # If from Git:
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd kasa-family-management
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   - Create a `.env.local` file in the `kasa-family-management` folder
   - Add:
     ```env
     MONGODB_URI=your_mongodb_connection_string
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
     STRIPE_SECRET_KEY=your_stripe_secret_key
     ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

5. **Access the App**
   - Open http://localhost:3000 in your browser

### Production Build:
```bash
npm run build
npm start
```

---

## Quick Deploy Script

I can create a deployment script that automates some of these steps. Would you like me to create one?

---

## Security Notes

⚠️ **Important**: Before sharing your app:

1. **Remove sensitive data** from `.env.local` (it's already in .gitignore)
2. **Don't commit** API keys or passwords
3. **Use environment variables** in production
4. **Review** what files are being shared

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas

