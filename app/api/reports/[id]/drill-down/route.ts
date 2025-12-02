import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ReportDrillDownService } from '@/lib/services/ReportDrillDownService'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET - Get drill-down configuration
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

    const config = await ReportDrillDownService.getDrillDownConfig(params.id)

    return NextResponse.json({ config })
  } catch (error: any) {
    console.error('Error fetching drill-down config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drill-down config', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Execute drill-down
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
    const { sourceField, sourceValue } = body

    if (!sourceField || sourceValue === undefined) {
      return NextResponse.json(
        { error: 'sourceField and sourceValue are required' },
        { status: 400 }
      )
    }

    const result = await ReportDrillDownService.executeDrillDown(
      params.id,
      sourceField,
      sourceValue,
      user.userId
    )

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('Error executing drill-down:', error)
    return NextResponse.json(
      { error: 'Failed to execute drill-down', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Configure drill-down
export async function PUT(
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

    const body = await request.json()
    const { configurations } = body

    if (!configurations || !Array.isArray(configurations)) {
      return NextResponse.json(
        { error: 'configurations array is required' },
        { status: 400 }
      )
    }

    const config = await ReportDrillDownService.configureDrillDown(
      params.id,
      configurations
    )

    return NextResponse.json({ config })
  } catch (error: any) {
    console.error('Error configuring drill-down:', error)
    return NextResponse.json(
      { error: 'Failed to configure drill-down', details: error.message },
      { status: 500 }
    )
  }
}

