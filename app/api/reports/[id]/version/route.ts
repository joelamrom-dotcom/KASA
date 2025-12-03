import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ReportVersionService } from '@/lib/services/ReportVersionService'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// POST - Create a new version of a report
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
    const { description } = body

    const version = await ReportVersionService.createVersion(
      params.id,
      user.userId,
      description
    )

    return NextResponse.json({ version }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating version:', error)
    return NextResponse.json(
      { error: 'Failed to create version', details: error.message },
      { status: 500 }
    )
  }
}

