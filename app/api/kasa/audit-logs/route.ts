import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuditLogs } from '@/lib/audit-log'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET - Get audit logs with filters
export async function GET(request: NextRequest) {
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
    // Note: Audit logs permission is typically part of roles management
    // For now, we'll use ROLES_VIEW as a proxy, but ideally there should be AUDIT_LOGS_VIEW permission
    const canViewAll = await hasPermission(user, PERMISSIONS.ROLES_VIEW)
    
    if (!canViewAll && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Permission required' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType') || undefined
    const entityId = searchParams.get('entityId') || undefined
    const action = searchParams.get('action') || undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')
    
    // If user doesn't have view all permission, only show logs for their own userId
    const userId = (canViewAll || user.role === 'super_admin') ? undefined : user.userId
    
    const logs = await getAuditLogs({
      userId,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
      limit,
      skip,
    })
    
    // Get total count for pagination (without limit/skip)
    const allLogs = await getAuditLogs({
      userId,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
    })
    const total = allLogs.length
    
    return NextResponse.json({
      logs,
      total,
      limit,
      skip,
    })
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', details: error.message },
      { status: 500 }
    )
  }
}

