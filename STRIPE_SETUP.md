# Stripe Integration Setup Guide

This guide will help you set up Stripe sandbox account for testing credit card payments.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Stripe sandbox/test API keys

## Setup Steps

### 1. Get Your Stripe API Keys

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. Make sure you're in **Test Mode** (toggle in the top right)
3. Go to **Developers** → **API keys**
4. Copy your **Publishable key** (starts with `pk_test_...`)
5. Copy your **Secret key** (starts with `sk_test_...`)

### 2. Configure Environment Variables

Create a `.env.local` file in the `kasa-family-management` directory (if it doesn't exist) and add:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

**Important:** 
- Replace `pk_test_your_publishable_key_here` with your actual publishable key
- Replace `sk_test_your_secret_key_here` with your actual secret key
- Never commit `.env.local` to version control (it's already in `.gitignore`)

### 3. Restart Your Development Server

After adding the environment variables, restart your Next.js development server:

```bash
npm run dev
```

### 4. Testing Payments

1. Navigate to a family detail page
2. Click "Add Payment"
3. Select "Credit Card" as the payment method
4. Check the "Use Stripe (Secure Payment)" checkbox
5. Enter test card details (see below)
6. Complete the payment

## Stripe Test Cards

Use these test card numbers for testing:

### Successful Payment
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., `12/34`)
- **CVC:** Any 3 digits (e.g., `123`)
- **ZIP:** Any 5 digits (e.g., `12345`)

### Declined Payment
- **Card Number:** `4000 0000 0000 0002`
- **Expiry:** Any future date
- **CVC:** Any 3 digits
- **ZIP:** Any 5 digits

### Requires Authentication (3D Secure)
- **Card Number:** `4000 0025 0000 3155`
- **Expiry:** Any future date
- **CVC:** Any 3 digits
- **ZIP:** Any 5 digits

For more test cards, visit: https://stripe.com/docs/testing

## How It Works

1. **Payment Intent Creation**: When you select "Use Stripe" and enter an amount, a payment intent is created on the server
2. **Card Input**: Stripe Elements provides a secure, PCI-compliant card input form
3. **Payment Confirmation**: When you submit, Stripe processes the payment securely
4. **Payment Recording**: Upon success, the payment is saved to your database with:
   - Payment amount
   - Payment method (credit_card)
   - Card details (last 4 digits, card type, expiry)
   - Stripe payment intent ID for reference

## Troubleshooting

### "Stripe is not configured" message
- Make sure `.env.local` exists and contains both keys
- Restart your development server after adding environment variables
- Check that keys start with `pk_test_` and `sk_test_` (for test mode)

### Payment fails
- Verify you're using test mode keys (not live keys)
- Check the browser console for error messages
- Check the server terminal for detailed error logs
- Ensure the amount is greater than $0.50 (Stripe minimum)

### Payment succeeds but doesn't appear in database
- Check server logs for errors in the confirm-payment endpoint
- Verify MongoDB connection is working
- Check that the family ID is valid

## Security Notes

- **Never** commit your secret keys to version control
- Use test keys for development, live keys only in production
- Stripe handles all PCI compliance - card numbers never touch your server
- Only the last 4 digits and card type are stored in your database

## Going Live

When you're ready to accept real payments:

1. Switch to **Live Mode** in Stripe Dashboard
2. Get your live API keys (starts with `pk_live_` and `sk_live_`)
3. Update `.env.local` with live keys (or use environment variables in production)
4. Test thoroughly with small amounts first

