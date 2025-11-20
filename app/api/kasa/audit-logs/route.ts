import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuditLogs } from '@/lib/audit-log'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get audit logs with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
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
    
    // If not super_admin, only show logs for their own userId
    const userId = user.role === 'super_admin' ? undefined : user.userId
    
    const { logs, total } = await getAuditLogs({
      userId,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
      limit,
      skip,
    })
    
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

