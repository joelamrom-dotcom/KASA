import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { User, NotificationPreference } from '@/lib/models'

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

    let pref = await NotificationPreference.findOne({ userId }).lean()

    if (!pref) {
      // Create default preferences
      pref = await NotificationPreference.create({
        userId
      })
    }

    return NextResponse.json({ preferences: pref })
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

    await NotificationPreference.findOneAndUpdate(
      { userId },
      { $set: preferences },
      { upsert: true, new: true }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences', details: error.message },
      { status: 500 }
    )
  }
}

