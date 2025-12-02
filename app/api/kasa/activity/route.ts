import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { AuditLog } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get activity feed
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const query: any = { userId }
    if (entityType) query.entityType = entityType
    if (entityId) query.entityId = new mongoose.Types.ObjectId(entityId)

    const activities = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'firstName lastName email')
      .lean()

    return NextResponse.json({ activities })
  } catch (error: any) {
    console.error('Error fetching activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity', details: error.message },
      { status: 500 }
    )
  }
}

