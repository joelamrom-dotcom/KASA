import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ReportSnapshotService } from '@/lib/services/ReportSnapshotService'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET - Get historical trends for a report
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasPermission(user, PERMISSIONS.REPORTS_VIEW))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    const trends = await ReportSnapshotService.getHistoricalTrends(params.id, startDate, endDate)

    return NextResponse.json({ trends })
  } catch (error: any) {
    console.error('Error fetching trends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trends', details: error.message },
      { status: 500 }
    )
  }
}

