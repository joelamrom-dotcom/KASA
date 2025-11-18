import Stripe from 'stripe'
import connectDB from './database'
import { StripeConfig, User, Family } from './models'
import https from 'https'

// Create HTTPS agent
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production',
})

// Get admin userId for a user (if user is not admin, find their admin through family)
async function getAdminUserId(userId: string): Promise<string | null> {
  await connectDB()
  
  const user = await User.findById(userId)
  if (!user) {
    return null
  }
  
  // If user is admin or super_admin, return their own userId
  if (user.role === 'admin' || user.role === 'super_admin') {
    return userId
  }
  
  // If user has a familyId, get the family's userId (which is the admin)
  if (user.familyId) {
    const family = await Family.findById(user.familyId)
    if (family && family.userId) {
      return family.userId.toString()
    }
  }
  
  // If user doesn't have a family, try to find an admin through their families
  // (for cases where user created families)
  const userFamilies = await Family.find({ userId }).limit(1)
  if (userFamilies.length > 0 && userFamilies[0].userId) {
    return userFamilies[0].userId.toString()
  }
  
  return null
}

// Get Stripe instance for a user (uses their admin's connected Stripe account)
export async function getUserStripe(userId: string): Promise<Stripe | null> {
  await connectDB()
  
  // Get admin userId (user's own if admin, or their admin's if regular user)
  const adminUserId = await getAdminUserId(userId)
  if (!adminUserId) {
    console.error(`No admin found for user ${userId}`)
    return null
  }
  
  const config = await StripeConfig.findOne({ userId: adminUserId, isActive: true })
  
  if (!config) {
    console.error(`No active Stripe config found for admin ${adminUserId}`)
    return null
  }
  
  // For Stripe Connect, we use the platform account with the connected account ID
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
  if (!STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not set')
    return null
  }
  
  // Initialize Stripe with platform account
  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
    httpAgent: httpsAgent,
  })
  
  // Return Stripe instance - when making API calls, use stripeAccountId in the options
  return stripe
}

// Get Stripe account ID for a user (uses their admin's account)
export async function getUserStripeAccountId(userId: string): Promise<string | null> {
  await connectDB()
  
  // Get admin userId (user's own if admin, or their admin's if regular user)
  const adminUserId = await getAdminUserId(userId)
  if (!adminUserId) {
    return null
  }
  
  const config = await StripeConfig.findOne({ userId: adminUserId, isActive: true })
  return config?.stripeAccountId || null
}

// Create payment intent using user's admin's Stripe account
export async function createPaymentIntentForUser(
  userId: string,
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>,
  familyId?: string
): Promise<Stripe.PaymentIntent | null> {
  const stripe = await getUserStripe(userId, familyId)
  const accountId = await getUserStripeAccountId(userId, familyId)
  
  if (!stripe || !accountId) {
    return null
  }
  
  // Create payment intent on the connected account
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    },
    {
      stripeAccount: accountId, // Use connected account
    }
  )
  
  return paymentIntent
}

