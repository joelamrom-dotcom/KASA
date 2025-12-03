import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { ReportTemplate } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET - Get all report templates
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
    const category = searchParams.get('category')

    const query: any = {
      $or: [
        { isPublic: true },
        { createdBy: user.userId },
      ],
    }

    if (category && category !== 'all') {
      query.category = category
    }

    const templates = await ReportTemplate.find(query)
      .sort({ usageCount: -1, createdAt: -1 })
      .populate('createdBy', 'firstName lastName email')
      .lean()

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new template
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
    const { name, description, category, icon, reportDefinition, isPublic, tags } = body

    if (!name || !reportDefinition) {
      return NextResponse.json(
        { error: 'Name and reportDefinition are required' },
        { status: 400 }
      )
    }

    const template = await ReportTemplate.create({
      name,
      description,
      category: category || 'custom',
      icon,
      reportDefinition,
      isPublic: isPublic || false,
      createdBy: user.userId,
      tags: tags || [],
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template', details: error.message },
      { status: 500 }
    )
  }
}

