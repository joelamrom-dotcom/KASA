import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ReportDependencyService } from '@/lib/services/ReportDependencyService'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// POST - Analyze impact of a data source change
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
    const { sourceName, changeType } = body

    if (!sourceName || !changeType) {
      return NextResponse.json(
        { error: 'sourceName and changeType are required' },
        { status: 400 }
      )
    }

    const impact = await ReportDependencyService.analyzeImpact(sourceName, changeType)

    return NextResponse.json({ impact })
  } catch (error: any) {
    console.error('Error analyzing impact:', error)
    return NextResponse.json(
      { error: 'Failed to analyze impact', details: error.message },
      { status: 500 }
    )
  }
}

