import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { StripeConfig } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

// GET - Get Stripe configuration for current user (admin/super_admin only)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required. Only admins and super admins can manage Stripe connections.' },
        { status: 401 }
      )
    }
    
    const config = await StripeConfig.findOne({ userId: user.userId, isActive: true })
    
    if (!config) {
      return NextResponse.json({ error: 'Stripe configuration not found' }, { status: 404 })
    }

    // Don't send sensitive tokens back
    return NextResponse.json({
      stripeAccountId: config.stripeAccountId,
      stripePublishableKey: config.stripePublishableKey,
      accountEmail: config.accountEmail,
      accountName: config.accountName,
      isActive: config.isActive,
      connectedAt: config.connectedAt,
      lastSyncedAt: config.lastSyncedAt
    })
  } catch (error: any) {
    console.error('Error fetching Stripe config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Stripe configuration', details: error.message },
      { status: 500 }
    )
  }
}

