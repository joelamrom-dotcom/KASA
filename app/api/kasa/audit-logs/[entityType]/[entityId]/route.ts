import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getEntityAuditLogs } from '@/lib/audit-log'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get audit logs for a specific entity
export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
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
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const logs = await getEntityAuditLogs(params.entityType, params.entityId, limit)
    
    return NextResponse.json({ logs })
  } catch (error: any) {
    console.error('Error fetching entity audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', details: error.message },
      { status: 500 }
    )
  }
}

