import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { StripeConfig } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// POST - Disconnect Stripe account
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
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
    
    return NextResponse.json({ message: 'Stripe account disconnected successfully' })
  } catch (error: any) {
    console.error('Error disconnecting Stripe:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Stripe account', details: error.message },
      { status: 500 }
    )
  }
}

