import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuditLogs } from '@/lib/audit-log'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET - Get audit logs for a specific entity
export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check permission - users with roles.view can view audit logs
    const canViewAll = await hasPermission(user, PERMISSIONS.ROLES_VIEW)
    
    if (!canViewAll && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Permission required' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    
    // If user doesn't have view all permission, only show logs for their own userId
    const userId = (canViewAll || user.role === 'super_admin') ? undefined : user.userId
    
    const logs = await getAuditLogs({
      userId,
      entityType: params.entityType,
      entityId: params.entityId,
      limit,
      skip: 0,
    })
    
    return NextResponse.json({ logs })
  } catch (error: any) {
    console.error('Error fetching entity audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', details: error.message },
      { status: 500 }
    )
  }
}

