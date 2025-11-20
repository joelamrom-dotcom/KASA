import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Notification } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// POST - Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    await Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read', details: error.message },
      { status: 500 }
    )
  }
}

