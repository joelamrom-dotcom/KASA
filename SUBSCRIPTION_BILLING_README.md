# Subscription & Billing System

## Overview

Your AI SaaS platform now includes a complete subscription and billing system that automatically:

1. **Creates members** with balance tracking
2. **Selects price plans** from your price table
3. **Auto-divides yearly prices** into 12 monthly payments
4. **Generates monthly statements** on the 1st of each month
5. **Tracks payments** and updates member balances

## 🚀 **How It Works**

### **1. Member Creation**
```typescript
// Create a new member
const member = await fetch('/api/members', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    createdBy: 'user-id'
  })
})
```

### **2. Subscription Creation**
```typescript
// Create subscription (auto-generates 12 monthly statements)
const subscription = await fetch('/api/subscriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    memberId: 'member-id',
    pricePlanId: 'price-plan-id',
    startDate: '2024-01-01T00:00:00.000Z', // Optional, defaults to now
    createdBy: 'user-id'
  })
})
```

### **3. Automatic Statement Generation**
When you create a subscription, the system automatically:
- Divides the yearly price by 12
- Creates 12 monthly statements
- Sets billing dates to the 1st of each month
- Sets due dates to 30 days after billing

## 📊 **Data Structure**

### **Member**
```json
{
  "id": "unique-id",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "balance": 0,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### **Subscription**
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
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### **Statement**
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
  "paidAmount": null,
  "paidDate": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 **API Endpoints**

### **Members**
```
GET /api/members?page=1&limit=10&search=john
POST /api/members
```

### **Subscriptions**
```
GET /api/subscriptions?memberId=member-id
POST /api/subscriptions
```

### **Statements**
```
GET /api/statements?memberId=member-id&page=1&limit=20
POST /api/statements (for payments)
PUT /api/statements (for status updates)
```

## 💡 **Usage Examples**

### **Complete Workflow**

```typescript
// 1. Create a member
const memberResponse = await fetch('/api/members', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '+1234567890'
  })
})
const member = await memberResponse.json()

// 2. Create subscription (auto-generates statements)
const subscriptionResponse = await fetch('/api/subscriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    memberId: member.id,
    pricePlanId: 'premium-plan-id'
  })
})
const subscription = await subscriptionResponse.json()

// 3. Get member statements
const statementsResponse = await fetch(`/api/statements?memberId=${member.id}`)
const statements = await statementsResponse.json()

// 4. Process payment
const paymentResponse = await fetch('/api/statements', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'pay',
    statementId: statements.statements[0].id,
    paymentAmount: 100
  })
})
const payment = await paymentResponse.json()
```

### **React Component Example**

```typescript
import { useState, useEffect } from 'react'

function MemberBilling({ memberId }) {
  const [statements, setStatements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/statements?memberId=${memberId}`)
      .then(res => res.json())
      .then(data => {
        setStatements(data.statements)
        setLoading(false)
      })
  }, [memberId])

  const processPayment = async (statementId, amount) => {
    const response = await fetch('/api/statements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'pay',
        statementId,
        paymentAmount: amount
      })
    })
    const result = await response.json()
    // Refresh statements
    window.location.reload()
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h2>Billing Statements</h2>
      {statements.map(statement => (
        <div key={statement.id} className="statement-card">
          <h3>{statement.description}</h3>
          <p>Amount: ${statement.amount}</p>
          <p>Due Date: {new Date(statement.dueDate).toLocaleDateString()}</p>
          <p>Status: {statement.status}</p>
          {statement.status === 'pending' && (
            <button onClick={() => processPayment(statement.id, statement.amount)}>
              Pay Now
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
```

## 📈 **Features**

### **Automatic Billing**
- ✅ **12-month statements** generated automatically
- ✅ **1st of month billing** dates
- ✅ **30-day payment terms**
- ✅ **Balance tracking** for each member

### **Payment Processing**
- ✅ **Payment recording** with amounts and dates
- ✅ **Balance updates** when payments are made
- ✅ **Status tracking** (pending, paid, overdue, cancelled)
- ✅ **Activity logging** for all transactions

### **Search & Pagination**
- ✅ **Member search** by name, email, phone
- ✅ **Statement pagination** for large datasets
- ✅ **Member filtering** for statements
- ✅ **Optimized queries** with indexing

### **Data Integrity**
- ✅ **Automatic validation** of required fields
- ✅ **Duplicate prevention** for member emails
- ✅ **Error handling** with meaningful messages
- ✅ **Activity logging** for audit trails

## 🛠 **Maintenance**

### **Database Optimization**
```bash
# Optimize database (removes expired data, archives old statements)
curl -X POST http://localhost:3000/api/database/optimize \
  -H "Content-Type: application/json" \
  -d '{"action": "optimize"}'
```

### **Get Statistics**
```bash
# Get billing statistics
curl -X POST http://localhost:3000/api/database/optimize \
  -H "Content-Type: application/json" \
  -d '{"action": "stats"}'
```

## 📊 **Expected Results**

When you create a subscription with a $1,200 yearly price:

1. **Monthly Amount**: $100 (automatically calculated)
2. **Statements Generated**: 12 monthly statements
3. **Billing Dates**: 1st of each month
4. **Due Dates**: 30 days after billing
5. **Member Balance**: Updated with each payment

## 🎯 **Next Steps**

1. **Test the system** with sample data
2. **Create UI components** for member management
3. **Add payment gateway integration** (Stripe, PayPal, etc.)
4. **Implement email notifications** for due dates
5. **Add reporting features** for revenue tracking

Your subscription and billing system is now ready to handle automatic monthly billing! 🚀
