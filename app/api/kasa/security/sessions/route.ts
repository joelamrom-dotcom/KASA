import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Session } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get active sessions
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const sessions = await Session.find({ userId, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      sessions: sessions.map((s: any) => ({
        _id: s._id.toString(),
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: s.token === request.headers.get('authorization')?.replace('Bearer ', '')
      }))
    })
  } catch (error: any) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Revoke session
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    await Session.findByIdAndDelete(sessionId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error revoking session:', error)
    return NextResponse.json(
      { error: 'Failed to revoke session', details: error.message },
      { status: 500 }
    )
  }
}

