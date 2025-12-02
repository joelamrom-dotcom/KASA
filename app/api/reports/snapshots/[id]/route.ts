import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ReportSnapshotService } from '@/lib/services/ReportSnapshotService'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET - Get a specific snapshot
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

    const snapshot = await ReportSnapshotService.getSnapshotById(params.id, user.userId)

    if (!snapshot) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
    }

    return NextResponse.json({ snapshot })
  } catch (error: any) {
    console.error('Error fetching snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to fetch snapshot', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a snapshot
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

    if (!(await hasPermission(user, PERMISSIONS.REPORTS_DELETE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await ReportSnapshotService.deleteSnapshot(params.id, user.userId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to delete snapshot', details: error.message },
      { status: 500 }
    )
  }
}

