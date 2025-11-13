# Quick Start Guide

## How to Run the Application

### Step 1: Install Dependencies
Open your terminal in the project folder and run:
```bash
cd kasa-family-management
npm install
```

### Step 2: Set Up Environment Variables
Create a file named `.env.local` in the root directory:
```bash
# Copy this content to .env.local
MONGODB_URI=mongodb://localhost:27017/kasa-family-db
```

**Note:** If you're using MongoDB Atlas instead of local MongoDB, use:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kasa-family-db
```

### Step 3: Start the Development Server
```bash
npm run dev
```

### Step 4: Open in Browser
Once the server starts, you'll see:
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

Open your browser and go to:
**http://localhost:3000**

### Step 5: Initialize Default Data
1. Click on "Dashboard" in the sidebar
2. Scroll down to "Quick Setup" section
3. Click "Initialize Default Data" button
4. This will create the default payment plans and lifecycle events

## What You'll See

### Home Page (`/`)
- Beautiful glassmorphism hero section
- Feature cards with hover effects
- Gradient backgrounds

### Dashboard (`/dashboard`)
- Statistics cards with glass effects
- Quick action buttons
- System status

### Families (`/families`)
- List of all families
- Add/Edit/Delete functionality
- Glass-styled modals

### Calculations (`/calculations`)
- Yearly financial calculations
- Income and expense breakdowns

### Statements (`/statements`)
- Generate financial statements
- Print functionality

## Troubleshooting

### Port Already in Use
If port 3000 is busy, Next.js will automatically use the next available port (3001, 3002, etc.)

### MongoDB Connection Issues
- Make sure MongoDB is running (if using local)
- Check your connection string in `.env.local`
- The app will work even without MongoDB initially (using fallback)

### Dependencies Installation Issues
If `npm install` fails:
```bash
# Clear cache and try again
npm cache clean --force
npm install
```

## Project Structure
```
kasa-family-management/
├── app/              # Next.js pages and API routes
├── lib/              # Database and utilities
├── types/            # TypeScript definitions
└── public/           # Static assets
```

## Next Steps After Running

1. **Add a Family**: Go to Families → Add Family
2. **Add Members**: Click on a family → Members tab → Add Member
3. **Record Payments**: Click on a family → Payments tab → Add Payment
4. **Calculate Year**: Go to Calculations → Calculate Year
5. **Generate Statement**: Go to Statements → Generate Statement

Enjoy your beautiful glassmorphism design! 🎨

