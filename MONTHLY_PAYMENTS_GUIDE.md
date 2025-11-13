# Monthly Payments Guide

## How Monthly Payments Work

When you select "Monthly Payment" for a credit card payment, here's what happens:

### 1. **Initial Payment Setup**

When a payment is made with "Monthly Payment" selected:

1. **Payment is processed immediately** - The first payment is charged right away
2. **Card is saved** - If using Stripe and "Save card" is checked, the card is saved for future use
3. **Recurring Payment is created** - A `RecurringPayment` record is created in the database with:
   - Family ID
   - Saved payment method (card on file)
   - Amount to charge each month
   - Start date (when first payment was made)
   - Next payment date (1 month from start date)
   - Status: Active

### 2. **Automatic Monthly Processing**

Every month, the system needs to process recurring payments. This can be done in two ways:

#### Option A: Manual Processing (via API)
Call the API endpoint to process all due payments:
```bash
POST /api/kasa/recurring-payments/process
```

#### Option B: Automated Processing (via Script)
Run the script manually or set up a cron job:
```bash
npm run process-monthly-payments
```

Or set up a cron job to run daily:
```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * cd /path/to/kasa-family-management && npm run process-monthly-payments
```

### 3. **What Happens During Processing**

When monthly payments are processed:

1. **Find due payments** - System finds all recurring payments where `nextPaymentDate` is today or earlier
2. **Charge each card** - For each due payment:
   - Charges the saved card via Stripe
   - Creates a payment record in the database
   - Links payment to the recurring payment
   - Updates `nextPaymentDate` to next month
3. **Handle failures** - If a payment fails:
   - Payment record shows failure status
   - Recurring payment remains active (will retry next month)
   - Error is logged

### 4. **Payment Records**

Each monthly payment creates a `Payment` record with:
- `paymentFrequency: 'monthly'`
- `recurringPaymentId`: Links to the recurring payment
- `savedPaymentMethodId`: Links to the card used
- Standard payment details (amount, date, type, etc.)

### 5. **Managing Recurring Payments**

#### View All Recurring Payments
```bash
GET /api/kasa/recurring-payments
GET /api/kasa/recurring-payments?familyId=<family-id>
```

#### Deactivate a Recurring Payment
Update the `RecurringPayment` record and set `isActive: false`

### 6. **Important Notes**

- **Card must be saved**: Monthly payments require a saved payment method (card on file)
- **Automatic vs Manual**: You need to either:
  - Set up a cron job to run the processing script daily
  - Manually call the API endpoint regularly
  - Use a service like Vercel Cron Jobs or similar
- **Payment failures**: Failed payments don't automatically cancel the recurring payment - you may want to add retry logic
- **Next payment date**: Automatically calculated as 1 month from the last successful payment

### 7. **Setting Up Automated Processing**

#### Using Vercel Cron Jobs (if deployed on Vercel)

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/kasa/recurring-payments/process",
    "schedule": "0 2 * * *"
  }]
}
```

#### Using Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 2:00 AM
4. Action: Start a program
5. Program: `node`
6. Arguments: `C:\path\to\kasa-family-management\scripts\process-monthly-payments.js`

#### Using Linux/Mac Cron

Add to crontab (`crontab -e`):
```
0 2 * * * cd /path/to/kasa-family-management && npm run process-monthly-payments >> /var/log/monthly-payments.log 2>&1
```

### 8. **Testing Monthly Payments**

To test monthly payments:

1. Create a payment with "Monthly Payment" selected
2. Manually update the `nextPaymentDate` in the database to today's date
3. Run the processing script: `npm run process-monthly-payments`
4. Check that payment was created and `nextPaymentDate` was updated

### 9. **Monitoring**

Check recurring payments status:
- View in database: `RecurringPayment` collection
- API endpoint: `GET /api/kasa/recurring-payments`
- Payment history: All monthly payments are linked via `recurringPaymentId`

## Summary

**Monthly payments require:**
1. ✅ Card saved to Stripe (saved payment method)
2. ✅ Recurring payment record created
3. ✅ Automated processing script/API called regularly
4. ✅ Payment records created each month automatically

The system handles the charging automatically once you set up the processing schedule!

