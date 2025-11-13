# Automatic Monthly Statement Generation

The Kasa Family Management system supports automatic monthly statement generation for all families.

## Features

- **Manual Generation**: Generate statements for all families for a specific month via the UI
- **Scheduled Generation**: Set up automated monthly generation using cron jobs or scheduled tasks
- **API Endpoint**: Programmatic access to statement generation

## How to Use

### 1. Manual Generation via UI

1. Navigate to the **Statements** page
2. Click the **"Auto-Generate Monthly"** button (green button with calendar icon)
3. Confirm the action
4. Statements will be generated for all families for the current month

### 2. API Endpoint

You can call the API endpoint directly:

```bash
# Generate for current month
curl -X POST http://localhost:3000/api/kasa/statements/auto-generate

# Generate for specific month (GET request)
curl "http://localhost:3000/api/kasa/statements/auto-generate?year=2024&month=12"
```

### 3. Scheduled Generation (Cron Job)

#### Option A: Using Node.js Script

Add to your crontab (Linux/Mac):

```bash
# Generate statements on the 1st of every month at 2 AM
0 2 1 * * cd /path/to/kasa-family-management && node scripts/generate-monthly-statements.js
```

Or use npm script:

```bash
0 2 1 * * cd /path/to/kasa-family-management && npm run generate-statements
```

#### Option B: Using Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Monthly, on the 1st, at 2:00 AM
4. Action: Start a program
5. Program: `node`
6. Arguments: `scripts/generate-monthly-statements.js`
7. Start in: `C:\path\to\kasa-family-management`

#### Option C: Using API with Cron

Use curl in cron:

```bash
# Generate statements on the 1st of every month at 2 AM
0 2 1 * * curl -X POST http://localhost:3000/api/kasa/statements/auto-generate
```

**Note**: Make sure your Next.js server is running if using the API endpoint.

## What Gets Generated

For each family, a statement includes:

- **Opening Balance**: Balance at the start of the month
- **Income**: Total payments received during the month
- **Withdrawals**: Total withdrawals during the month
- **Expenses**: Total lifecycle event costs during the month
- **Closing Balance**: Balance at the end of the month

## Duplicate Prevention

The system automatically skips families that already have a statement for the requested month to prevent duplicates.

## Monthly Schedule Recommendation

We recommend generating statements on the **1st of each month** at **2:00 AM** to ensure:
- All transactions from the previous month are included
- Statements are ready early in the morning
- Low server load time

## Troubleshooting

### Statements Not Generating

1. Check MongoDB connection
2. Verify families exist in the database
3. Check server logs for errors
4. Ensure date ranges are correct

### Missing Transactions

If transactions are missing from statements:
- Verify transaction dates fall within the statement date range
- Check that transactions are properly linked to families

### Manual Month Generation

To generate statements for a past month:

```bash
# Generate for December 2024
node scripts/generate-monthly-statements.js 2024 12
```

Or via API:

```bash
curl "http://localhost:3000/api/kasa/statements/auto-generate?year=2024&month=12"
```

