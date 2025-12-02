import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ReportVersionService } from '@/lib/services/ReportVersionService'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// POST - Compare two versions
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
    const { versionId1, versionId2 } = body

    if (!versionId1 || !versionId2) {
      return NextResponse.json(
        { error: 'Both versionId1 and versionId2 are required' },
        { status: 400 }
      )
    }

    const comparison = await ReportVersionService.compareVersions(versionId1, versionId2)

    return NextResponse.json({ comparison })
  } catch (error: any) {
    console.error('Error comparing versions:', error)
    return NextResponse.json(
      { error: 'Failed to compare versions', details: error.message },
      { status: 500 }
    )
  }
}

