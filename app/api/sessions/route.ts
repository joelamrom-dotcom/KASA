import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Session, User } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getRequestInfo } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

/**
 * GET /api/sessions
 * Get all active sessions for the current user (or all users if admin)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // Users can only view their own sessions unless they have users.view permission
    const canViewAll = await hasPermission(user, PERMISSIONS.USERS_VIEW)
    const targetUserId = canViewAll && userId ? userId : user.userId
    
    const sessions = await Session.find({ userId: targetUserId })
      .populate('userId', 'email firstName lastName')
      .populate('revokedBy', 'email firstName lastName')
      .sort({ lastActivity: -1 })
      .lean()
    
    return NextResponse.json({ sessions })
  } catch (error: any) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sessions/[id]
 * Revoke a session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const session = await Session.findById(params.id)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    // Users can only revoke their own sessions unless they have users.update permission
    const canRevokeAll = await hasPermission(user, PERMISSIONS.USERS_UPDATE)
    if (!canRevokeAll && session.userId.toString() !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    session.isActive = false
    session.revokedAt = new Date()
    session.revokedBy = user.userId
    await session.save()
    
    return NextResponse.json({ message: 'Session revoked successfully' })
  } catch (error: any) {
    console.error('Error revoking session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to revoke session' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sessions/revoke-all
 * Revoke all sessions for a user (except current session)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const data = await request.json()
    const { userId, currentToken } = data
    
    // Users can only revoke their own sessions unless they have users.update permission
    const canRevokeAll = await hasPermission(user, PERMISSIONS.USERS_UPDATE)
    const targetUserId = canRevokeAll && userId ? userId : user.userId
    
    // Revoke all sessions except the current one
    await Session.updateMany(
      {
        userId: targetUserId,
        token: { $ne: currentToken },
        isActive: true,
      },
      {
        isActive: false,
        revokedAt: new Date(),
        revokedBy: user.userId,
      }
    )
    
    return NextResponse.json({ message: 'All sessions revoked successfully' })
  } catch (error: any) {
    console.error('Error revoking sessions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to revoke sessions' },
      { status: 500 }
    )
  }
}

