import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// POST - Unsubscribe from push notifications
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId } = body

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(userId || user.userId)

    // Remove push subscription from user
    await User.findByIdAndUpdate(userObjectId, {
      $unset: {
        pushSubscription: '',
        pushEnabled: ''
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Push notifications disabled'
    })
  } catch (error: any) {
    console.error('Error unsubscribing from push:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe from push notifications', details: error.message },
      { status: 500 }
    )
  }
}

