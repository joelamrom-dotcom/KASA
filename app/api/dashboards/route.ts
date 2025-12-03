import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { DashboardService } from '@/lib/services/DashboardService'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET - Get all dashboards for a user
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
    const includePublic = searchParams.get('includePublic') !== 'false'

    const dashboards = await DashboardService.getDashboardsByUser(user.userId, includePublic)

    return NextResponse.json({ dashboards })
  } catch (error: any) {
    console.error('Error fetching dashboards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboards', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new dashboard
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
    const { name, description, components, layout } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const dashboard = await DashboardService.createDashboard(
      user.userId,
      name,
      description,
      components,
      layout
    )

    return NextResponse.json({ dashboard }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to create dashboard', details: error.message },
      { status: 500 }
    )
  }
}

