import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ReportSnapshotService } from '@/lib/services/ReportSnapshotService'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// POST - Compare two snapshots
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasPermission(user, PERMISSIONS.REPORTS_VIEW))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { snapshotId1, snapshotId2 } = body

    if (!snapshotId1 || !snapshotId2) {
      return NextResponse.json(
        { error: 'Both snapshotId1 and snapshotId2 are required' },
        { status: 400 }
      )
    }

    const comparison = await ReportSnapshotService.compareSnapshots(snapshotId1, snapshotId2)

    return NextResponse.json({ comparison })
  } catch (error: any) {
    console.error('Error comparing snapshots:', error)
    return NextResponse.json(
      { error: 'Failed to compare snapshots', details: error.message },
      { status: 500 }
    )
  }
}

