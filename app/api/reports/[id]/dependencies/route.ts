import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ReportDependencyService } from '@/lib/services/ReportDependencyService'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET - Get dependencies for a report
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

    const dependencyGraph = await ReportDependencyService.getDependencyGraph(params.id)

    return NextResponse.json({ dependencyGraph })
  } catch (error: any) {
    console.error('Error fetching dependencies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dependencies', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Analyze dependencies for a report
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

    if (!(await hasPermission(user, PERMISSIONS.REPORTS_VIEW))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { reportDefinition } = body

    if (!reportDefinition) {
      return NextResponse.json({ error: 'reportDefinition is required' }, { status: 400 })
    }

    const dependency = await ReportDependencyService.analyzeDependencies(
      params.id,
      reportDefinition
    )

    return NextResponse.json({ dependency })
  } catch (error: any) {
    console.error('Error analyzing dependencies:', error)
    return NextResponse.json(
      { error: 'Failed to analyze dependencies', details: error.message },
      { status: 500 }
    )
  }
}

