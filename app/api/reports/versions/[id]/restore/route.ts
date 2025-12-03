import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ReportVersionService } from '@/lib/services/ReportVersionService'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// POST - Restore a report to a previous version
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasPermission(user, PERMISSIONS.REPORTS_UPDATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await ReportVersionService.restoreVersion(params.id, user.userId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error restoring version:', error)
    return NextResponse.json(
      { error: 'Failed to restore version', details: error.message },
      { status: 500 }
    )
  }
}

