import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { StripeConfig } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import Stripe from 'stripe'

// Initialize Stripe with platform account (for Connect)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set - Stripe Connect will not work')
}

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
}) : null

// POST - Initiate Stripe OAuth connection
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.' },
        { status: 500 }
      )
    }
    
    const user = getAuthenticatedUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required. Only admins and super admins can connect Stripe accounts.' },
        { status: 401 }
      )
    }
    
    // Get the base URL for redirect
    const origin = request.headers.get('origin') || request.nextUrl.origin
    
    // Get or create Stripe Connect account
    const accountId = await getOrCreateStripeAccount(user.userId)
    
    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/settings?stripe=refresh`,
      return_url: `${origin}/settings?stripe=success&tab=stripe`,
      type: 'account_onboarding',
    })
    
    return NextResponse.json({ url: accountLink.url })
  } catch (error: any) {
    console.error('Error initiating Stripe connection:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    })
    return NextResponse.json(
      { 
        error: 'Failed to initiate Stripe connection', 
        details: error.message,
        type: error.type,
        code: error.code
      },
      { status: 500 }
    )
  }
}

// Helper function to get or create Stripe Connect account
async function getOrCreateStripeAccount(userId: string): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not initialized')
  }
  
  await connectDB()
  
  // Check if user already has a Stripe account (including inactive ones)
  const existingConfig = await StripeConfig.findOne({ userId })
  if (existingConfig) {
    return existingConfig.stripeAccountId
  }
  
  try {
    // Create new Stripe Connect Express account (can be created via API)
    // Express accounts are faster to onboard and can be created programmatically
    const account = await stripe.accounts.create({
      type: 'express', // Express accounts can be created via API
      country: 'US', // Default, can be made configurable
      email: undefined, // Will be collected during onboarding
    })
    
    // Save account ID (we'll save tokens after OAuth callback)
    await StripeConfig.create({
      userId,
      stripeAccountId: account.id,
      accessToken: '', // Will be set after OAuth
      isActive: false, // Not active until OAuth completes
    })
    
    return account.id
  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error)
    console.error('Stripe error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    })
    throw error
  }
}

