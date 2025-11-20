import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { MessageHistory } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get message history
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const messages = await MessageHistory.find({ userId })
      .sort({ sentAt: -1 })
      .limit(50)

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('Error fetching message history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message history', details: error.message },
      { status: 500 }
    )
  }
}

