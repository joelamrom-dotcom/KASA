# Automatic Monthly Statement Email Sending

The Kasa Family Management system supports automatic monthly statement email sending. On the 1st of each month, the system will automatically send PDF statements via email to all families with email addresses.

## Features

- **Automatic Monthly Sending**: Statements are sent automatically on the 1st of each month
- **PDF Attachments**: Each email includes a professionally formatted PDF statement
- **Email Configuration Storage**: Email settings are saved securely in the database
- **Previous Month Statements**: Automatically generates and sends statements for the previous month

## Setup Instructions

### 1. Configure Email Settings

1. Navigate to the **Statements** page
2. Click **"Send Statements via Email"** button
3. Enter your Gmail credentials:
   - **Gmail Address**: Your Gmail account
   - **Gmail App Password**: Generate from [Google Account Settings](https://myaccount.google.com/apppasswords)
   - **From Name**: Display name for emails (default: "Kasa Family Management")
4. **Important**: Check the checkbox **"Save email configuration for automatic monthly sending"**
5. Click **"Send Emails"**

This will save your email configuration to the database for automatic use.

### 2. Set Up Cron Job

You need to set up a cron job or scheduled task to call the API endpoint on the 1st of each month.

#### Option A: Using Node.js Script (Recommended)

Add to your crontab (Linux/Mac):

```bash
# Send monthly statements on the 1st of every month at 2 AM
0 2 1 * * cd /path/to/kasa-family-management && npm run send-monthly-statements
```

Or use the script directly:

```bash
0 2 1 * * cd /path/to/kasa-family-management && node scripts/send-monthly-statements.js
```

#### Option B: Using Windows Task Scheduler

1. Open **Task Scheduler**
2. Create **Basic Task**
3. Set trigger: **Monthly**, on the **1st**, at **2:00 AM**
4. Action: **Start a program**
5. Program: `node`
6. Arguments: `scripts/send-monthly-statements.js`
7. Start in: `C:\path\to\kasa-family-management`

#### Option C: Using API with Cron (If server is always running)

Use curl in cron:

```bash
# Send monthly statements on the 1st of every month at 2 AM
0 2 1 * * curl -X POST http://localhost:3000/api/kasa/statements/send-monthly-emails
```

**Note**: Make sure your Next.js server is running if using the API endpoint.

#### Option D: Using External Cron Service

If you're hosting on Vercel or similar, you can use:
- **Vercel Cron Jobs**: Add to `vercel.json`
- **Cron-job.org**: Free online cron service
- **EasyCron**: Another online cron service

Example `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/kasa/statements/send-monthly-emails",
      "schedule": "0 2 1 * *"
    }
  ]
}
```

## How It Works

1. **On the 1st of each month**, the cron job triggers the script
2. The script calls `/api/kasa/statements/send-monthly-emails`
3. The API endpoint:
   - Retrieves saved email configuration from database
   - Calculates previous month's date range
   - Finds all families with email addresses
   - For each family:
     - Generates statement for previous month
     - Creates PDF attachment
     - Sends email with PDF
   - Returns summary of sent/failed emails

## Email Configuration Management

### View Current Configuration

```bash
GET /api/kasa/email-config
```

### Update Configuration

```bash
POST /api/kasa/email-config
Content-Type: application/json

{
  "email": "your-email@gmail.com",
  "password": "your-app-password",
  "fromName": "Kasa Family Management"
}
```

## Testing

You can manually test the automatic sending:

```bash
# Using npm script
npm run send-monthly-statements

# Or directly
node scripts/send-monthly-statements.js

# Or via API
curl -X POST http://localhost:3000/api/kasa/statements/send-monthly-emails
```

## Environment Variables

The script uses the `API_URL` environment variable if your server is not on localhost:

```bash
export API_URL=https://your-domain.com
npm run send-monthly-statements
```

## Troubleshooting

### Email Configuration Not Found

If you see "Email configuration not found":
1. Make sure you've saved the email configuration via the UI
2. Check that `isActive: true` in the database
3. Verify the EmailConfig collection exists

### Emails Not Sending

1. **Check Gmail App Password**: Make sure you're using an app password, not your regular password
2. **Verify Email Configuration**: Check that email config is saved correctly
3. **Check Server Logs**: Look for error messages in the console
4. **Test Manually**: Try sending emails manually from the UI first

### Cron Job Not Running

1. **Check Cron Logs**: Look at system logs for cron execution
2. **Verify Path**: Make sure the path to the script is correct
3. **Check Permissions**: Ensure the script has execute permissions
4. **Test Manually**: Run the script manually to verify it works

## Security Notes

- **Email passwords are stored in the database** - Consider encrypting them in production
- **Use Gmail App Passwords** - Never use your main Gmail password
- **Restrict API Access** - Consider adding authentication to the API endpoint
- **Monitor Email Sending** - Check logs regularly for failed sends

## API Endpoints

### Send Monthly Statements
```
POST /api/kasa/statements/send-monthly-emails
```

Automatically sends statements for the previous month to all families with emails.

### Email Configuration
```
GET /api/kasa/email-config
POST /api/kasa/email-config
```

Manage email configuration settings.

