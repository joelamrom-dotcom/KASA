import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { StripeConfig } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import Stripe from 'stripe'

// Initialize Stripe with platform account
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
}) : null

// GET - Handle Stripe OAuth callback
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    if (!stripe) {
      return NextResponse.redirect(new URL('/settings?stripe=error&message=Stripe not configured', request.url))
    }
    
    const user = getAuthenticatedUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.redirect(new URL('/login?redirect=/settings&error=Admin access required', request.url))
    }
    
    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get('account_id')
    
    if (!accountId) {
      return NextResponse.redirect(new URL('/settings?stripe=error&message=No account ID provided', request.url))
    }
    
    // Retrieve account details from Stripe
    const account = await stripe.accounts.retrieve(accountId)
    
    // Update or create StripeConfig
    const config = await StripeConfig.findOne({ userId: user.userId })
    
    if (config) {
      // Update existing config
      await StripeConfig.findByIdAndUpdate(config._id, {
        stripeAccountId: accountId,
        stripePublishableKey: account.settings?.payouts?.schedule?.delay_days ? undefined : undefined, // We'll get this from account
        accountEmail: account.email,
        accountName: account.business_profile?.name || account.settings?.dashboard?.display_name || account.email,
        isActive: account.charges_enabled && account.payouts_enabled,
        lastSyncedAt: new Date()
      })
    } else {
      // Create new config
      await StripeConfig.create({
        userId: user.userId,
        stripeAccountId: accountId,
        accessToken: '', // OAuth tokens are handled by Stripe Connect
        stripePublishableKey: undefined, // Not available in standard accounts
        accountEmail: account.email,
        accountName: account.business_profile?.name || account.settings?.dashboard?.display_name || account.email,
        isActive: account.charges_enabled && account.payouts_enabled,
        connectedAt: new Date(),
        lastSyncedAt: new Date()
      })
    }
    
    return NextResponse.redirect(new URL('/settings?stripe=success&tab=stripe', request.url))
  } catch (error: any) {
    console.error('Error handling Stripe callback:', error)
    return NextResponse.redirect(new URL(`/settings?stripe=error&message=${encodeURIComponent(error.message)}`, request.url))
  }
}

