# Monthly Billing System

## Overview

Your AI SaaS platform now includes a **monthly billing system** that:

1. **Creates statements month by month** (not all 12 upfront)
2. **Auto-calculates monthly amount** = yearly price ÷ 12
3. **Shows last 10 activities** on each statement
4. **Tracks balance changes** and payment history
5. **Generates next month statements** on demand

## 🚀 **How It Works**

### **1. Create Subscription (First Month Only)**
```typescript
// Creates subscription + first month statement only
const subscription = await fetch('/api/subscriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    memberId: 'member-id',
    pricePlanId: 'price-plan-id',
    startDate: '2024-01-01T00:00:00.000Z'
  })
})
```

### **2. Generate Next Month Statement**
```typescript
// Generate next month statement when needed
const nextStatement = await fetch('/api/subscriptions', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'generate-next-month',
    subscriptionId: 'subscription-id'
  })
})
```

### **3. Get Statement with Activities**
```typescript
// Get statement with last 10 activities
const statement = await fetch('/api/statements?statementId=statement-id')
```

## 📊 **Data Structure**

### **Subscription (Updated)**
```json
{
  "id": "unique-id",
  "memberId": "member-id",
  "pricePlanId": "price-plan-id",
  "pricePlanTitle": "Premium Plan",
  "yearlyPrice": 1200,
  "monthlyAmount": 100,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": null,
  "status": "active",
  "currentMonth": 1,
  "totalMonths": 12,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### **Statement (Updated)**
```json
{
  "id": "unique-id",
  "memberId": "member-id",
  "subscriptionId": "subscription-id",
  "amount": 100,
  "billingDate": "2024-01-01T00:00:00.000Z",
  "dueDate": "2024-01-31T00:00:00.000Z",
  "status": "pending",
  "description": "Monthly payment for Premium Plan - Month 1",
  "monthNumber": 1,
  "paidAmount": null,
  "paidDate": null,
  "recentActivities": [
    {
      "id": "activity-id",
      "type": "payment_received",
      "description": "Payment received for statement xxx",
      "metadata": {
        "paymentAmount": 100,
        "oldBalance": 0,
        "newBalance": 100
      },
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 **API Endpoints**

### **Subscriptions**
```
GET /api/subscriptions?memberId=member-id
POST /api/subscriptions (create subscription + first statement)
PUT /api/subscriptions (generate next month statement)
```

### **Statements**
```
GET /api/statements?memberId=member-id (with activities)
GET /api/statements?statementId=statement-id (single statement with activities)
POST /api/statements (process payment)
PUT /api/statements (update status)
```

## 💡 **Usage Examples**

### **Complete Monthly Workflow**

```typescript
// 1. Create member
const member = await fetch('/api/members', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  })
})

// 2. Create subscription (generates first month statement)
const subscription = await fetch('/api/subscriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    memberId: member.id,
    pricePlanId: 'premium-plan-id'
  })
})

// 3. Get first statement with activities
const firstStatement = await fetch(`/api/statements?statementId=${subscription.firstStatement.id}`)

// 4. Process payment
const payment = await fetch('/api/statements', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'pay',
    statementId: firstStatement.id,
    paymentAmount: 100
  })
})

// 5. Generate next month statement (when needed)
const nextStatement = await fetch('/api/subscriptions', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'generate-next-month',
    subscriptionId: subscription.id
  })
})
```

### **React Component with Activities**

```typescript
import { useState, useEffect } from 'react'

function StatementWithActivities({ statementId }) {
  const [statement, setStatement] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/statements?statementId=${statementId}`)
      .then(res => res.json())
      .then(data => {
        setStatement(data)
        setLoading(false)
      })
  }, [statementId])

  if (loading) return <div>Loading...</div>

  return (
    <div className="statement-container">
      <div className="statement-header">
        <h2>{statement.description}</h2>
        <p>Amount: ${statement.amount}</p>
        <p>Due Date: {new Date(statement.dueDate).toLocaleDateString()}</p>
        <p>Status: {statement.status}</p>
      </div>

      <div className="recent-activities">
        <h3>Recent Activities (Last 10)</h3>
        {statement.recentActivities.map(activity => (
          <div key={activity.id} className="activity-item">
            <div className="activity-header">
              <span className="activity-type">{activity.type}</span>
              <span className="activity-date">
                {new Date(activity.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="activity-description">{activity.description}</p>
            {activity.metadata && (
              <div className="activity-metadata">
                {activity.metadata.paymentAmount && (
                  <span>Payment: ${activity.metadata.paymentAmount}</span>
                )}
                {activity.metadata.oldBalance !== undefined && (
                  <span>Balance: ${activity.metadata.oldBalance} → ${activity.metadata.newBalance}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 📈 **Key Features**

### **Monthly Statement Generation**
- ✅ **First month only** when creating subscription
- ✅ **On-demand generation** for subsequent months
- ✅ **Month tracking** (currentMonth: 1-12)
- ✅ **Automatic calculation** (yearly price ÷ 12)

### **Activity Tracking**
- ✅ **Last 10 activities** shown on each statement
- ✅ **Payment history** with balance changes
- ✅ **Statement status updates** logged
- ✅ **Subscription events** tracked

### **Balance Management**
- ✅ **Real-time balance updates** on payments
- ✅ **Balance history** in activity metadata
- ✅ **Payment amount tracking** per statement
- ✅ **Member balance** persistence

### **Smart Activity Filtering**
- ✅ **Member-specific activities** only
- ✅ **Payment-related activities** included
- ✅ **Statement-related activities** included
- ✅ **Chronological ordering** (newest first)

## 🛠 **Monthly Workflow**

### **Month 1:**
1. Create subscription → Generates first statement
2. Process payment → Updates balance + logs activity
3. View statement → Shows payment activity

### **Month 2:**
1. Generate next month statement → Creates month 2 statement
2. Process payment → Updates balance + logs activity
3. View statement → Shows both month 1 and 2 activities

### **Month 3-12:**
1. Repeat monthly generation
2. Track all activities
3. Maintain balance history

## 📊 **Activity Types Tracked**

- `subscription_created` - New subscription
- `payment_received` - Payment processed
- `statement_paid` - Statement marked as paid
- `statement_status_updated` - Status changes
- `next_month_statement_generated` - New month created

## 🎯 **Benefits**

1. **No upfront statement generation** - Saves database space
2. **Monthly control** - Generate when needed
3. **Activity history** - See payment and balance changes
4. **Flexible billing** - Handle cancellations, changes
5. **Audit trail** - Complete activity logging

Your monthly billing system is now ready to handle month-by-month statement generation with full activity tracking! 🚀
