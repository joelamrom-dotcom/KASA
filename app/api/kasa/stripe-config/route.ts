import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { StripeConfig } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET - Get Stripe configuration for current user (admin/super_admin only)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.SETTINGS_VIEW))) {
      return NextResponse.json(
        { error: 'Forbidden - Settings view permission required' },
        { status: 403 }
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

