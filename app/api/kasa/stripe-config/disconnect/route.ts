import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { StripeConfig } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

// POST - Disconnect Stripe account
export async function POST(request: NextRequest) {
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
    if (!(await hasPermission(user, PERMISSIONS.SETTINGS_UPDATE))) {
      return NextResponse.json(
        { error: 'Forbidden - Settings update permission required' },
        { status: 403 }
      )
    }
    
    const config = await StripeConfig.findOne({ userId: user.userId, isActive: true })
    
    if (!config) {
      return NextResponse.json(
        { error: 'No Stripe account connected' },
        { status: 404 }
      )
    }
    
    // Deactivate the config
    await StripeConfig.findByIdAndUpdate(config._id, {
      isActive: false
    })
    
    // Create audit log entry
    await auditLogFromRequest(request, user, 'stripe_disconnect', 'settings', {
      entityId: config._id.toString(),
      entityName: 'Stripe Configuration',
      description: `Disconnected Stripe account ${config.stripeAccountId}`,
      metadata: {
        stripeAccountId: config.stripeAccountId,
        accountEmail: config.accountEmail,
      }
    })
    
    return NextResponse.json({ message: 'Stripe account disconnected successfully' })
  } catch (error: any) {
    console.error('Error disconnecting Stripe:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Stripe account', details: error.message },
      { status: 500 }
    )
  }
}

