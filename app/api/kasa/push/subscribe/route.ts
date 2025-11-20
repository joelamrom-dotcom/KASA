import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import webpush from 'web-push'

export const dynamic = 'force-dynamic'

// Configure VAPID keys (should be in environment variables)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HIeBv8wHvA_S8MFjXDvVj5a0bN0y2vDLq1m8w0fOjYF_2tJQN7vH5fG8c'
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''

if (VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@kasa.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

// GET - Get VAPID public key for subscription
export async function GET(request: NextRequest) {
  return NextResponse.json({
    publicKey: VAPID_PUBLIC_KEY
  })
}

// POST - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subscription, userId } = body

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(userId || user.userId)

    // Update user with push subscription
    await User.findByIdAndUpdate(userObjectId, {
      $set: {
        pushSubscription: subscription,
        pushEnabled: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Push notifications enabled'
    })
  } catch (error: any) {
    console.error('Error subscribing to push:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe to push notifications', details: error.message },
      { status: 500 }
    )
  }
}

