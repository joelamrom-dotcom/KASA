# Kasa Family Management System - Project Summary

## Overview
A complete financial management system for family organizations, replicating the logic from the Excel spreadsheet "ווייס משפחה קאסע new.xlsm". The system tracks age-based payment plans, lifecycle events, and calculates yearly financial balances.

## Project Structure

```
kasa-family-management/
├── app/
│   ├── api/
│   │   └── kasa/
│   │       ├── payment-plans/     # Payment plan management
│   │       ├── families/          # Family CRUD operations
│   │       │   └── [id]/          # Individual family operations
│   │       ├── calculations/       # Yearly calculation engine
│   │       └── init/               # Initialize default data
│   ├── components/                # React components
│   ├── dashboard/                  # Dashboard page
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home page
│   └── globals.css                 # Global styles
├── lib/
│   ├── database.ts                 # MongoDB connection
│   ├── models.ts                   # Mongoose schemas
│   ├── calculations.ts             # Calculation engine (Excel logic)
│   └── init-data.ts                # Default data initialization
├── types/
│   └── index.ts                    # TypeScript type definitions
└── package.json                    # Dependencies and scripts
```

## Key Features Implemented

### 1. Database Models
- **PaymentPlan**: Age-based payment plans (0-4, 5-8, 9-16, 17+)
- **LifecycleEvent**: Event types and amounts (Chasena, Bar Mitzvah, Birth)
- **Family**: Family information and payment tracking
- **FamilyMember**: Children/members with birth dates
- **Payment**: Membership payment records
- **Withdrawal**: Withdrawal records
- **LifecycleEventPayment**: Lifecycle event payment records
- **YearlyCalculation**: Calculated financial data per year
- **Statement**: Generated statements for families

### 2. Calculation Engine (`lib/calculations.ts`)
Replicates Excel logic:
- **Age Group Calculation**: Determines which payment plan applies based on age
- **Yearly Income Calculation**: 
  - Counts members in each age group
  - Multiplies by payment plan amount
  - Adds extra donations
- **Yearly Expense Calculation**:
  - Counts lifecycle events per year
  - Calculates total expense amounts
  - Adds extra expenses
- **Balance Calculation**: Income - Expenses

### 3. API Routes
- `GET/POST /api/kasa/payment-plans` - Manage payment plans
- `GET/POST /api/kasa/families` - Manage families
- `GET/PUT/DELETE /api/kasa/families/[id]` - Individual family operations
- `GET/POST /api/kasa/calculations` - Yearly calculations
- `POST /api/kasa/init` - Initialize default data

### 4. Frontend
- **Home Page**: Welcome page with feature overview
- **Dashboard**: Statistics and quick actions

## Payment Plans (Matching Excel)

| Plan | Age Range | Yearly Price |
|------|-----------|--------------|
| Plan 1 | 0-4 years | $1,200 |
| Plan 2 | 5-8 years | $1,500 |
| Plan 3 | 9-16 years | $1,800 |
| Plan 4 | 17+ years | $2,500 |

## Lifecycle Events (Matching Excel)

| Event Type | Amount |
|------------|--------|
| Chasena (Wedding) | $12,180 |
| Bar Mitzvah | $1,800 |
| Birth Boy | $500 |
| Birth Girl | $500 |

## Calculation Logic

For each year:
1. **Count Members** by age group as of December 31st
2. **Calculate Income**: 
   - (Count 0-4 × $1,200) + (Count 5-8 × $1,500) + (Count 9-16 × $1,800) + (Count 17+ × $2,500)
   - Add extra donations
3. **Calculate Expenses**:
   - Sum of all lifecycle event payments in that year
   - Add extra expenses
4. **Calculate Balance**: Total Income - Total Expenses

## Getting Started

1. **Install Dependencies**:
```bash
npm install
```

2. **Set up Environment**:
Create `.env.local`:
```
MONGODB_URI=mongodb://localhost:27017/kasa-family-db
```

3. **Initialize Default Data**:
```bash
# Start the dev server first
npm run dev

# Then call the init endpoint
curl -X POST http://localhost:3000/api/kasa/init
```

4. **Run Development Server**:
```bash
npm run dev
```

5. **Access the Application**:
- Home: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard

## Next Steps (Pending)

- [ ] Create family management UI components
- [ ] Create member management interface
- [ ] Create payment tracking interface
- [ ] Create lifecycle event management
- [ ] Create statement generation UI
- [ ] Add charts and visualizations
- [ ] Add authentication (optional)
- [ ] Add export functionality (Excel/PDF)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose
- **Icons**: Heroicons
- **Charts**: Recharts (ready to use)

## Notes

- The calculation engine exactly replicates the Excel logic
- All payment amounts match the Excel file
- Age calculations use December 31st as the reference date for each year
- The system is designed to handle years 2020-2091 (matching Excel)

