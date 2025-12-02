import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { User } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get notification preferences
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const userDoc = await User.findById(userId).lean()

    return NextResponse.json({
      preferences: {
        email: {
          enabled: true,
          frequency: 'real-time', // 'real-time', 'daily', 'weekly'
          categories: {
            payments: true,
            events: true,
            tasks: true,
            system: true
          }
        },
        sms: {
          enabled: (userDoc as any)?.receiveSMS || false,
          categories: {
            payments: true,
            reminders: true
          }
        },
        push: {
          enabled: (userDoc as any)?.pushEnabled || false,
          categories: {
            payments: true,
            events: true,
            tasks: true
          }
        },
        digest: {
          enabled: false,
          frequency: 'daily', // 'daily', 'weekly'
          time: '09:00'
        }
      }
    })
  } catch (error: any) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { preferences } = body

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Update user notification preferences (would need schema fields)
    await User.findByIdAndUpdate(userId, {
      $set: {
        notificationPreferences: preferences
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences', details: error.message },
      { status: 500 }
    )
  }
}

