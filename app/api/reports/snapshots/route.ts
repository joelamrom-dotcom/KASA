import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { ReportSnapshotService } from '@/lib/services/ReportSnapshotService'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET - Get all snapshots for a report
export async function GET(request: NextRequest) {
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
    const reportId = searchParams.get('reportId')

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 })
    }

    const snapshots = await ReportSnapshotService.getSnapshotsByReport(reportId, user.userId)

    return NextResponse.json({ snapshots })
  } catch (error: any) {
    console.error('Error fetching snapshots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch snapshots', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new snapshot
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasPermission(user, PERMISSIONS.REPORTS_CREATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { reportId, name, description, data, summary } = body

    if (!reportId || !name) {
      return NextResponse.json(
        { error: 'reportId and name are required' },
        { status: 400 }
      )
    }

    const snapshot = await ReportSnapshotService.createSnapshot(
      reportId,
      user.userId,
      name,
      description,
      data,
      summary
    )

    return NextResponse.json({ snapshot }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to create snapshot', details: error.message },
      { status: 500 }
    )
  }
}

