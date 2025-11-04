# Statement PDF Generation & Dunning Flow Features

## Overview
This document describes the new **Statement PDF Generation** and **Dunning Flow** features added to the Goldberger Family Dashboard. These features provide professional statement generation and automated payment collection workflows.

## 🎯 Statement PDF Generation

### Features
- **Professional PDF Statements**: Generate branded, printable statements for each member
- **Complete Member Information**: Includes member details, statement information, and payment instructions
- **Responsive Design**: Print-optimized layout with proper styling
- **Audit Trail**: All PDF generations are logged in the audit system

### How to Use
1. **From Statements Table**: Click the "📄 PDF" button next to any statement
2. **From Dunning Report**: Use the "📄 PDF" button in the overdue statements list
3. **Automatic Download**: PDF files are automatically downloaded with descriptive names

### PDF Content Includes
- Family/Company branding and contact information
- Member details (name, email, phone, member ID)
- Statement details (number, dates, plan information)
- Prominent amount due display
- Payment instructions and contact information
- Professional footer with generation date

### File Naming Convention
```
statement-{statementNumber}-{memberName}.html
```
Example: `statement-2024-001-John-Smith.html`

---

## ⚡ Dunning Flow System

### What is Dunning?
Dunning is an automated process for collecting overdue payments through a series of escalating reminders and actions.

### Core Features

#### 1. **Configurable Settings** (Super Admin Only)
- **Grace Period**: Days after due date before first reminder (default: 7 days)
- **Reminder Intervals**: When to send reminders (default: 3, 7, 14, 30 days)
- **Auto-Suspend**: Days after due date to suspend accounts (default: 45 days)
- **Email Templates**: Customizable messages for reminders, final warnings, and reinstatements

#### 2. **Automated Actions**
- **Payment Reminders**: Automated emails at configured intervals
- **Account Suspension**: Automatic suspension after grace period
- **Account Reinstatement**: Automatic reactivation when payment is received
- **Audit Logging**: All actions are tracked in the audit system

#### 3. **Aging Reports**
- **30/60/90 Day Aging**: Categorizes overdue amounts by age
- **Visual Summary**: Quick overview of overdue amounts and counts
- **Detailed Breakdown**: Complete list of overdue statements with actions

### How to Use

#### Accessing Dunning Features
1. **Quick Actions Bar**: Available buttons for all users with appropriate permissions
   - 📊 **Dunning Report**: View aging summary and overdue statements
   - ⚡ **Run Dunning**: Execute the automated dunning process
   - ⚙️ **Dunning Settings**: Configure dunning parameters (Super Admin only)

#### Running the Dunning Process
1. Click "⚡ Run Dunning" in Quick Actions
2. System automatically:
   - Identifies overdue statements
   - Sends reminders based on configured intervals
   - Suspends accounts that exceed the auto-suspend threshold
   - Reinstates accounts that have been paid
3. View results in the summary modal

#### Viewing Dunning Reports
1. Click "📊 Dunning Report" in Quick Actions
2. Review aging summary (1-30, 31-60, 61-90, 90+ days)
3. See detailed list of overdue statements
4. Take actions directly from the report:
   - Generate PDF statements
   - Mark statements as paid
   - Export report data

#### Configuring Dunning Settings
1. Click "⚙️ Dunning Settings" (Super Admin only)
2. Adjust parameters:
   - **Grace Period**: Days before first reminder
   - **Reminder Intervals**: Comma-separated list of days
   - **Auto-Suspend**: Days before account suspension
   - **Email Templates**: Customize message content
3. Save settings (stored in localStorage)

### Email Templates
Use these placeholders in your email templates:
- `{memberName}`: Member's full name
- `{amount}`: Statement amount with dollar sign
- `{statementNumber}`: Statement number

Example template:
```
Dear {memberName}, your payment of {amount} for statement #{statementNumber} is overdue. Please remit payment to avoid service interruption.
```

### Status Tracking
The system tracks these statement statuses:
- **pending**: Normal, not yet due
- **overdue**: Past due date
- **suspended**: Account suspended due to non-payment
- **paid**: Payment received

---

## 🔧 Technical Implementation

### New Functions Added

#### PDF Generation
- `generateStatementPDF(statementId)`: Main PDF generation function
- `generatePDFContent(statement, member, subscription, family)`: Creates HTML content
- `downloadPDF(content, filename)`: Handles file download

#### Dunning System
- `showDunningSettings()`: Opens settings modal
- `saveDunningSettings()`: Saves configuration
- `runDunningProcess()`: Executes automated dunning
- `getOverdueStatements()`: Identifies overdue statements
- `getDaysOverdue(dueDate)`: Calculates days overdue
- `sendDunningEmail(member, statement, templateType)`: Sends email notifications
- `showDunningReport()`: Displays aging report
- `generateAgingReport()`: Creates aging summary
- `exportDunningReport()`: Exports report data
- `markAsPaid(statementId)`: Marks statement as paid

### Data Structures
```javascript
// Dunning settings stored in localStorage
dunningSettings = {
    gracePeriod: 7,
    reminderIntervals: [3, 7, 14, 30],
    autoSuspend: 45,
    emailTemplates: {
        reminder: '...',
        final: '...',
        reinstatement: '...'
    }
}
```

### Integration Points
- **Audit Log**: All actions are logged with appropriate categories
- **Role-Based Access**: Features respect user permissions
- **Auto-Save**: Changes are automatically persisted
- **Quick Actions**: New buttons added to the main dashboard

---

## 🎨 UI Enhancements

### New CSS Classes
- `.aging-grid`: Grid layout for aging summary
- `.aging-item`: Individual aging category display
- `.result-item`: Dunning process results display
- `.status-suspended`: New status badge for suspended accounts
- `.btn-secondary`: New button style for PDF generation

### Modal Components
- **Dunning Settings Modal**: Configuration interface
- **Dunning Results Modal**: Process execution summary
- **Dunning Report Modal**: Aging report and overdue statements

---

## 🔒 Security & Permissions

### Access Control
- **Dunning Settings**: Super Admin only
- **Dunning Reports**: All users with `canViewAllData()`
- **Run Dunning Process**: All users with `canViewAllData()`
- **PDF Generation**: Available to all users (read-only operation)

### Data Protection
- Email templates support HTML escaping
- All actions are logged in audit trail
- Settings are stored securely in localStorage

---

## 🚀 Future Enhancements

### Planned Features
1. **Real Email Integration**: Connect to email service (SendGrid, etc.)
2. **SMS Notifications**: Add SMS reminders via Twilio
3. **Payment Gateway Integration**: Direct payment processing
4. **Advanced Templates**: Rich HTML email templates
5. **Scheduled Dunning**: Automated daily/weekly execution
6. **Custom Aging Buckets**: User-defined aging categories
7. **Payment Plans**: Installment payment options
8. **Collection Agency Integration**: Escalation to third-party collectors

### Technical Improvements
1. **Server-Side PDF Generation**: Use libraries like Puppeteer for true PDFs
2. **Email Queue System**: Robust email delivery with retry logic
3. **Webhook Integration**: Real-time payment notifications
4. **Advanced Analytics**: Payment success rates, collection efficiency
5. **API Endpoints**: RESTful API for external integrations

---

## 📋 Usage Examples

### Scenario 1: First-Time Setup
1. Super Admin logs in
2. Clicks "⚙️ Dunning Settings"
3. Configures grace period (7 days)
4. Sets reminder intervals (3, 7, 14, 30 days)
5. Sets auto-suspend (45 days)
6. Customizes email templates
7. Saves settings

### Scenario 2: Daily Operations
1. Admin clicks "⚡ Run Dunning"
2. System processes overdue statements
3. Sends appropriate reminders
4. Suspends accounts if needed
5. Shows results summary
6. Admin reviews and takes additional actions

### Scenario 3: Monthly Reporting
1. Admin clicks "📊 Dunning Report"
2. Reviews aging summary
3. Identifies high-risk accounts
4. Generates PDF statements for overdue accounts
5. Exports report for accounting
6. Takes manual collection actions

---

## 🐛 Troubleshooting

### Common Issues

#### PDF Not Downloading
- Check browser download settings
- Ensure popup blockers are disabled
- Verify statement ID exists

#### Dunning Process Not Working
- Verify dunning settings are configured
- Check that statements have valid due dates
- Ensure member email addresses are valid

#### Aging Report Empty
- Confirm statements exist with overdue dates
- Check date formats and timezone settings
- Verify statement status values

### Debug Information
- All dunning actions are logged to console
- Check browser console for detailed error messages
- Audit log contains all system actions
- Email content is logged to console (demo mode)

---

## 📞 Support

For technical support or feature requests:
1. Check the audit log for system actions
2. Review browser console for error messages
3. Verify user permissions and role assignments
4. Test with sample data to isolate issues

The dunning system is designed to be robust and self-documenting, with comprehensive logging and error handling to help identify and resolve any issues quickly.
