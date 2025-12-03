import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ReportSnapshotService } from '@/lib/services/ReportSnapshotService'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// POST - Create a snapshot of a report
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

    if (!(await hasPermission(user, PERMISSIONS.REPORTS_CREATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    // First, execute the report to get current data
    // This would call the report generation endpoint
    const reportDataRes = await fetch(`${request.nextUrl.origin}/api/kasa/reports/custom/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({ reportId: params.id }),
    })

    if (!reportDataRes.ok) {
      throw new Error('Failed to generate report data')
    }

    const reportData = await reportDataRes.json()

    const snapshot = await ReportSnapshotService.createSnapshot(
      params.id,
      user.userId,
      name,
      description,
      reportData.data,
      reportData.summary
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

