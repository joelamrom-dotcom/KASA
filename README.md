# Kasa Family Financial Management System

A comprehensive financial management system for family organizations, implementing age-based payment plans and lifecycle event tracking.

## Features

- **Age-Based Payment Plans**: Automatic payment calculation based on children's ages
  - Plan 1: Ages 0-4 ($1,200/year)
  - Plan 2: Ages 5-8 ($1,500/year)
  - Plan 3: Ages 9-16 ($1,800/year)
  - Plan 4: Ages 17+ ($2,500/year)

- **Lifecycle Event Tracking**: Track and manage one-time payments for:
  - Chasena (Wedding): $12,180
  - Bar Mitzvah: $1,800
  - Birth Boy: $500
  - Birth Girl: $500

- **Yearly Financial Calculations**: Automatic calculation of income, expenses, and balances per year
- **Family Management**: Track families, members, and payment history
- **Statement Generation**: Generate financial statements for members
- **Dashboard**: Comprehensive dashboard with financial overview

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Charts**: Recharts

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (create `.env.local`):
```env
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key (optional)
STRIPE_SECRET_KEY=your_stripe_secret_key (optional)
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Quick Deploy to Vercel (Recommended)

1. Install Vercel CLI: `npm install -g vercel`
2. Run: `vercel` in the project directory
3. Follow the prompts
4. Add environment variables in Vercel dashboard
5. Your app will be live at `https://your-app.vercel.app`

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### Package for Sharing

**Windows (PowerShell):**
```powershell
.\scripts\package-for-sharing.ps1
```

**Mac/Linux:**
```bash
chmod +x scripts/package-for-sharing.sh
./scripts/package-for-sharing.sh
```

This creates a ZIP file excluding `node_modules` and sensitive files that you can share.

## Project Structure

```
kasa-family-management/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   └── (pages)           # Page components
├── lib/                   # Utilities and database
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## License

ISC

