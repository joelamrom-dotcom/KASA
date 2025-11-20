import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuditLogs } from '@/lib/audit-log'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Export audit logs as CSV
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
    
    // If not super_admin, only show logs for their own userId
    const userId = user.role === 'super_admin' ? undefined : user.userId
    
    // Get all logs (no pagination for export)
    const { logs } = await getAuditLogs({
      userId,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
      limit: 10000, // Large limit for export
      skip: 0,
    })
    
    // Convert to CSV
    const headers = [
      'Date/Time',
      'User Email',
      'User Role',
      'Action',
      'Entity Type',
      'Entity Name',
      'Description',
      'Changes',
      'IP Address',
      'User Agent'
    ]
    
    const csvRows = [
      headers.join(','),
      ...logs.map((log: any) => {
        const formatValue = (value: any) => {
          if (value === null || value === undefined) return ''
          const str = String(value)
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }
        
        const changesStr = log.changes 
          ? JSON.stringify(log.changes).replace(/"/g, '""')
          : ''
        
        return [
          formatValue(new Date(log.createdAt).toISOString()),
          formatValue(log.userEmail || ''),
          formatValue(log.userRole || ''),
          formatValue(log.action || ''),
          formatValue(log.entityType || ''),
          formatValue(log.entityName || ''),
          formatValue(log.description || ''),
          formatValue(changesStr),
          formatValue(log.ipAddress || ''),
          formatValue(log.userAgent || ''),
        ].join(',')
      })
    ]
    
    const csv = csvRows.join('\n')
    
    // Generate filename with date range
    const dateStr = startDate || endDate 
      ? `${startDate ? startDate.toISOString().split('T')[0] : 'all'}_to_${endDate ? endDate.toISOString().split('T')[0] : 'all'}`
      : 'all'
    const filename = `audit-logs_${dateStr}_${new Date().toISOString().split('T')[0]}.csv`
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to export audit logs', details: error.message },
      { status: 500 }
    )
  }
}

