<<<<<<< HEAD
# AI SaaS Platform

A modern SaaS staging platform built with Next.js 14, TypeScript, and Tailwind CSS.

## ✅ **Current Status: FULLY WORKING**

The system is now completely functional with:
- ✅ User registration and authentication
- ✅ Login/logout functionality  
- ✅ Dashboard with real data
- ✅ Project management
- ✅ Activity logging
- ✅ JSON file-based database
- ✅ Responsive UI with navigation

## 🚀 **Quick Start**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📋 **Features**

### **Authentication**
- User registration with validation
- Secure password hashing with bcrypt
- Login/logout functionality
- Session management (localStorage)

### **Dashboard**
- Real-time user statistics
- Project overview with charts
- Recent activity feed
- User management interface

### **Project Management**
- Create, view, and manage projects
- Project status tracking
- Budget and progress monitoring
- Activity logging

### **Database**
- JSON file-based database
- No external dependencies
- Automatic data persistence
- Activity logging

## 🛠 **Tech Stack**

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS, Headless UI
- **Icons:** Heroicons
- **Charts:** Recharts
- **Forms:** React Hook Form, Zod validation
- **Database:** Custom JSON file system
- **Authentication:** bcryptjs for password hashing

## 📁 **Project Structure**

```
ai-saas-platform/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── users/
│   │   ├── projects/
│   │   └── activities/
│   ├── components/
│   │   └── Navigation.tsx
│   ├── dashboard/
│   ├── login/
│   ├── projects/
│   ├── register/
│   └── layout.tsx
├── lib/
│   └── jsonDb.js
├── data/
│   └── database.json
└── public/
```

## 🔧 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### **Data**
- `GET /api/users` - List all users
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/activities` - List all activities

## 🎯 **Usage**

1. **Register a new account** at `/register`
2. **Login** with your credentials at `/login`
3. **View dashboard** at `/dashboard`
4. **Manage projects** at `/projects`
5. **Navigate** using the top navigation bar

## 🔒 **Security**

- Passwords are hashed using bcrypt
- Input validation on all forms
- Error handling for all API endpoints
- No sensitive data exposed in responses

## 🚀 **Deployment**

The application is ready for deployment to:
- Vercel
- Netlify
- Any Node.js hosting platform

## 📝 **Development**

- **Database:** Data is stored in `data/database.json`
- **Logs:** Check browser console and server logs
- **Debug:** Use `/debug` page for API testing

## 🎉 **Success!**

The system is now fully operational with:
- ✅ Working user registration
- ✅ Functional login system
- ✅ Real-time dashboard
- ✅ Project management
- ✅ Activity tracking
- ✅ Responsive navigation

**Ready for production use!**
=======
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

>>>>>>> e871ae6ee9b954bce1542dbaba651a8702b4a713
