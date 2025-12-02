import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { MessageHistory } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get communication inbox
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const familyId = searchParams.get('familyId')
    const type = searchParams.get('type') // 'email' | 'sms'
    const limit = parseInt(searchParams.get('limit') || '50')

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const query: any = { userId }
    if (familyId) query.familyId = new mongoose.Types.ObjectId(familyId)
    if (type) query.type = type

    const messages = await MessageHistory.find(query)
      .sort({ sentAt: -1 })
      .limit(limit)
      .populate('familyId', 'name email')
      .lean()

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('Error fetching inbox:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inbox', details: error.message },
      { status: 500 }
    )
  }
}

