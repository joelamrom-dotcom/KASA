# Gmail Integration Setup Guide

## Overview
This guide will help you set up Gmail integration for sending automated dunning emails from your Goldberger Family Dashboard.

## 🚀 Quick Setup Steps

### 1. Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google," click "2-Step Verification"
4. Follow the prompts to enable 2FA on your Gmail account

### 2. Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" from the dropdown
3. Select "Other (Custom name)" and enter "Goldberger Dashboard"
4. Click "Generate"
5. **Copy the 16-character password** (no spaces)

### 3. Configure Email Service
1. Open your Goldberger Family Dashboard
2. Log in as Super Admin
3. Click "📧 Email Config" in Quick Actions
4. Enter your Gmail address
5. Paste the 16-character app password
6. Set a display name (optional)
7. Click "🧪 Test Configuration"
8. Check your email for the test message
9. Click "Save Configuration"

## 🔧 Detailed Setup Instructions

### Prerequisites
- Gmail account with 2-Factor Authentication enabled
- Super Admin access to the dashboard
- Modern web browser

### Step-by-Step Process

#### Step 1: Enable 2-Factor Authentication
**Why is this required?**
Google requires 2FA to be enabled before you can generate app passwords. This is a security requirement.

1. **Access Google Account Settings**
   - Go to https://myaccount.google.com/
   - Sign in with your Gmail account

2. **Navigate to Security**
   - Click "Security" in the left sidebar
   - Scroll down to "Signing in to Google"

3. **Enable 2-Step Verification**
   - Click "2-Step Verification"
   - Follow the setup process
   - You can use SMS, authenticator app, or backup codes

#### Step 2: Generate App Password
**What is an App Password?**
An app password is a 16-character code that allows applications to access your Gmail account without using your main password.

1. **Access App Passwords**
   - Go to https://myaccount.google.com/apppasswords
   - You may need to sign in again

2. **Select Application**
   - Choose "Mail" from the first dropdown
   - Choose "Other (Custom name)" from the second dropdown
   - Enter "Goldberger Dashboard" as the name

3. **Generate Password**
   - Click "Generate"
   - **Important**: Copy the 16-character password immediately
   - It will look like: `abcd efgh ijkl mnop` (remove spaces when using)

#### Step 3: Configure Dashboard
1. **Open Dashboard**
   - Open your Goldberger Family Dashboard
   - Log in as Super Admin user

2. **Access Email Configuration**
   - Click "📧 Email Config" in the Quick Actions section
   - This opens the email configuration modal

3. **Enter Configuration**
   - **Gmail Address**: Your full Gmail address (e.g., `yourname@gmail.com`)
   - **App Password**: The 16-character password from Step 2 (no spaces)
   - **From Name**: Optional display name (e.g., "Goldberger Family Management")

4. **Test Configuration**
   - Click "🧪 Test Configuration"
   - Wait for the test to complete
   - Check your Gmail inbox for a test email

5. **Save Configuration**
   - If the test is successful, click "Save Configuration"
   - Your settings are now stored locally in your browser

## 📧 How It Works

### Email Sending Process
1. **Dunning Process Triggered**: When you run the dunning process
2. **Email Generation**: System creates HTML email with statement details
3. **Gmail SMTP**: Uses your configured Gmail account to send emails
4. **Delivery**: Emails are sent to member email addresses
5. **Audit Log**: All email activity is logged in the audit system

### Email Templates
The system uses customizable email templates for:
- **Payment Reminders**: Gentle reminders for overdue payments
- **Final Notices**: Warning emails before account suspension
- **Reinstatement Notices**: Confirmation when accounts are reactivated

### Template Variables
Use these placeholders in your email templates:
- `{memberName}`: Member's full name
- `{amount}`: Statement amount with dollar sign
- `{statementNumber}`: Statement number

## 🔒 Security Considerations

### App Password Security
- **Never share** your app password
- **Don't use** on public computers
- **Store securely** - it's saved locally in your browser
- **Regenerate** if compromised

### Email Privacy
- Emails are sent from your Gmail account
- Recipients will see your Gmail address as sender
- Consider using a dedicated Gmail account for business

### Data Protection
- Email content is generated locally
- No email content is stored on external servers
- All email activity is logged in the audit trail

## 🐛 Troubleshooting

### Common Issues

#### "Invalid credentials" error
- **Cause**: Incorrect app password or Gmail address
- **Solution**: 
  1. Verify your Gmail address is correct
  2. Regenerate the app password
  3. Make sure to remove spaces from the password

#### "2-Step Verification required" error
- **Cause**: 2FA not enabled on Gmail account
- **Solution**: Enable 2-Factor Authentication first

#### Test email not received
- **Cause**: Email delivery issues or spam filtering
- **Solution**:
  1. Check spam/junk folder
  2. Verify recipient email address
  3. Check Gmail sending limits (500/day for regular accounts)

#### "Configuration not found" error
- **Cause**: Email configuration not saved
- **Solution**: 
  1. Re-enter configuration
  2. Click "Save Configuration"
  3. Refresh the page and try again

### Debug Information
- Check browser console for error messages
- Verify email configuration in localStorage
- Review audit log for email activity
- Test with a different Gmail account

## 📊 Email Limits and Best Practices

### Gmail Sending Limits
- **Regular Gmail**: 500 emails per day
- **Google Workspace**: 2000 emails per day
- **Rate limiting**: ~100 emails per hour

### Best Practices
1. **Test First**: Always test with a small group
2. **Monitor Limits**: Check your Gmail sending statistics
3. **Respect Recipients**: Don't spam or send too frequently
4. **Professional Content**: Use appropriate email templates
5. **Backup Plan**: Have alternative communication methods

## 🔄 Advanced Configuration

### Custom Email Templates
You can customize email templates in the Dunning Settings:
1. Click "⚙️ Dunning Settings"
2. Scroll to email template sections
3. Modify the text as needed
4. Use template variables: `{memberName}`, `{amount}`, `{statementNumber}`

### Multiple Email Accounts
For high-volume sending, consider:
- Using Google Workspace (higher limits)
- Setting up multiple Gmail accounts
- Using email service providers (SendGrid, Mailgun)

### Scheduled Sending
Currently, emails are sent immediately when running the dunning process. For automated scheduling, you would need:
- Backend server implementation
- Cron jobs or scheduled tasks
- Email queue system

## 📞 Support

### Getting Help
If you encounter issues:
1. **Check this guide** for troubleshooting steps
2. **Review browser console** for error messages
3. **Verify Gmail settings** are correct
4. **Test with simple configuration** first

### Alternative Solutions
If Gmail integration doesn't work for your needs:
- **Email Service Providers**: SendGrid, Mailgun, Mailchimp
- **Backend Integration**: Custom server-side email service
- **Manual Process**: Export email list and send manually

### Security Concerns
If you have security concerns about storing app passwords:
- Use dedicated Gmail account for business
- Regularly rotate app passwords
- Consider server-side email service
- Implement additional security measures

---

## ✅ Setup Checklist

- [ ] Enable 2-Factor Authentication on Gmail
- [ ] Generate App Password for "Mail"
- [ ] Copy 16-character app password
- [ ] Open Goldberger Dashboard as Super Admin
- [ ] Click "📧 Email Config" in Quick Actions
- [ ] Enter Gmail address and app password
- [ ] Set optional display name
- [ ] Test configuration
- [ ] Verify test email received
- [ ] Save configuration
- [ ] Test dunning process with real emails

Once completed, your dashboard will be able to send professional dunning emails automatically when you run the dunning process!
