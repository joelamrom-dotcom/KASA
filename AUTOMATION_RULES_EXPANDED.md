# Expanded Automation Rules - New Triggers & Actions

## 🎉 New Trigger Types Added

### Payment Triggers
- ✅ **Payment Failed** - When a payment fails to process
- ✅ **Payment Plan Changed** - When a family's payment plan is updated

### Member Triggers
- ✅ **Member Deleted** - When a member is removed from a family
- ✅ **Member Birthday** - On a member's birthday (scheduled trigger)

### Family Triggers
- ✅ **Family Deleted** - When a family is deleted/archived
- ✅ **Family Balance Changed** - When family balance changes (any change, not just threshold)

### Lifecycle Event Triggers
- ✅ **Lifecycle Event Updated** - When a lifecycle event is modified

### Financial Triggers
- ✅ **Withdrawal Created** - When a withdrawal is recorded
- ✅ **Recurring Payment Created** - When a recurring payment is set up
- ✅ **Recurring Payment Processed** - When a recurring payment is successfully processed
- ✅ **Recurring Payment Failed** - When a recurring payment fails

### Task Triggers
- ✅ **Task Updated** - When a task is modified
- ✅ **Task Completed** - When a task is marked as completed

### Document & Communication Triggers
- ✅ **Statement Sent** - When a statement is emailed to a family
- ✅ **Invoice Generated** - When an invoice is created
- ✅ **Document Uploaded** - When a document is uploaded
- ✅ **Note Added** - When a note is added to a family
- ✅ **Reminder Sent** - When a reminder is sent

## 🎯 New Action Types Added

### Communication Actions
- ✅ **Send Push Notification** - Send in-app push notification
- ✅ **Send Statement** - Email a statement to a family
- ✅ **Send Invoice** - Email an invoice to a family

### Task Management Actions
- ✅ **Update Task** - Update task status, priority, or details

### Payment Actions
- ✅ **Update Recurring Payment** - Modify recurring payment settings
- ✅ **Create Payment Link** - Generate a payment link for a family
- ✅ **Create Withdrawal** - Record a withdrawal

### Lifecycle Event Actions
- ✅ **Update Lifecycle Event** - Modify lifecycle event details

### Family Management Actions
- ✅ **Add Family Note** - Add a note to a family record
- ✅ **Add Family Tag** - Tag a family (e.g., VIP, Priority)
- ✅ **Remove Family Tag** - Remove a tag from a family
- ✅ **Update Family Balance** - Recalculate and update family balance
- ✅ **Archive Family** - Archive a family
- ✅ **Restore Family** - Restore an archived family

### Document Actions
- ✅ **Create Document** - Create a document (placeholder for future implementation)
- ✅ **Generate Invoice** - Generate an invoice (placeholder for future implementation)

### Data Actions
- ✅ **Export Data** - Export data (placeholder for future implementation)

## 📊 Total Count

### Triggers: **31** (up from 13)
### Actions: **28** (up from 11)

## 🚀 Example Use Cases

### Example 1: Auto-Tag High-Value Families
```
Trigger: Payment Received
Conditions:
  - payment.amount greater_than 1000
Actions:
  - Add Family Tag
    Tag Name: High Value
    Color: #10b981
```

### Example 2: Auto-Complete Task After Payment
```
Trigger: Payment Received
Conditions:
  - payment.amount greater_or_equal family.balance
Actions:
  - Update Task
    Status: completed
    (Uses task from trigger data)
```

### Example 3: Create Payment Link for Overdue
```
Trigger: Payment Overdue
Conditions:
  - family.balance greater_than 0
Actions:
  - Create Payment Link
    Amount: {{family.balance}}
    Description: Overdue Payment
    Max Uses: 1
  - Send Email
    To: family
    Subject: Payment Request
    Body: Please pay your overdue balance using this link: {{payment.linkUrl}}
```

### Example 4: Add Note When Member Birthday
```
Trigger: Member Birthday
Actions:
  - Add Family Note
    Note: Birthday reminder for {{member.firstName}} {{member.lastName}}
    Category: reminder
  - Send Email
    To: family
    Subject: Birthday Reminder
    Body: Happy birthday to {{member.firstName}}!
```

### Example 5: Archive Inactive Families
```
Trigger: Scheduled (monthly)
Conditions:
  - family.balance equals 0
  - (Check last payment date > 1 year ago)
Actions:
  - Archive Family
  - Send Email
    To: admin
    Subject: Family Archived
    Body: Family {{family.name}} has been archived due to inactivity.
```

## 🔧 Implementation Details

### New Action Executors

All new actions have been implemented in `lib/automation-engine.ts`:

1. **executeSendPushNotification** - Sends push notifications
2. **executeUpdateTask** - Updates task status/priority
3. **executeUpdateRecurringPayment** - Modifies recurring payments
4. **executeUpdateLifecycleEvent** - Updates lifecycle events
5. **executeCreateWithdrawal** - Creates withdrawal records
6. **executeAddFamilyNote** - Adds notes to families
7. **executeAddFamilyTag** - Tags families
8. **executeRemoveFamilyTag** - Removes tags
9. **executeSendStatement** - Emails statements
10. **executeGenerateInvoice** - Generates invoices (placeholder)
11. **executeSendInvoice** - Emails invoices
12. **executeCreatePaymentLink** - Creates payment links
13. **executeCreateDocument** - Creates documents (placeholder)
14. **executeUpdateFamilyBalance** - Recalculates balances
15. **executeArchiveFamily** - Archives families
16. **executeRestoreFamily** - Restores families
17. **executeExportData** - Exports data (placeholder)

### UI Updates

- Updated `AutomationRuleBuilder.tsx` with all new trigger and action types
- Added configuration UI for:
  - Add/Remove Family Tag
  - Create Payment Link
  - Create Withdrawal
  - Update Task
  - Add Family Note
  - Send Push Notification

## 📝 Next Steps

To fully utilize these new triggers, you'll need to add event triggers throughout the system:

1. **Payment Failed** - Add trigger in payment processing routes
2. **Recurring Payment Processed** - Add trigger in recurring payment processor
3. **Task Completed** - Add trigger in task update route
4. **Member Birthday** - Add scheduled job to check birthdays daily
5. **Family Balance Changed** - Add trigger when balance is updated
6. **Document Uploaded** - Add trigger in document upload route

## 🎯 Benefits

1. **More Automation Options** - 31 triggers and 28 actions provide extensive automation capabilities
2. **Better Workflow Management** - Tag families, manage tasks, track everything
3. **Improved Communication** - Multiple ways to communicate with families
4. **Financial Automation** - Automate payment links, withdrawals, and balance updates
5. **Lifecycle Management** - Better control over family lifecycle

---

**The automation system is now significantly more powerful!** 🚀

