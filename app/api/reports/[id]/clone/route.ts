import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { CustomReport } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

// POST - Clone a report
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
    const { name } = body

    const originalReport = await CustomReport.findOne({
      _id: params.id,
      $or: [
        { userId: new mongoose.Types.ObjectId(user.userId) },
        { isPublic: true },
      ],
    }).lean()

    if (!originalReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Create a copy of the report
    const clonedReport = await CustomReport.create({
      userId: new mongoose.Types.ObjectId(user.userId),
      name: name || `${originalReport.name} (Copy)`,
      description: originalReport.description,
      fields: originalReport.fields,
      filters: originalReport.filters,
      crossFilters: originalReport.crossFilters,
      fieldToFieldFilters: originalReport.fieldToFieldFilters,
      parameters: originalReport.parameters,
      rowLevelSecurity: originalReport.rowLevelSecurity,
      dateRange: originalReport.dateRange,
      groupBy: originalReport.groupBy,
      sortBy: originalReport.sortBy,
      sortOrder: originalReport.sortOrder,
      comparison: originalReport.comparison,
      exportSettings: originalReport.exportSettings,
      isActive: true,
    })

    return NextResponse.json({ report: clonedReport }, { status: 201 })
  } catch (error: any) {
    console.error('Error cloning report:', error)
    return NextResponse.json(
      { error: 'Failed to clone report', details: error.message },
      { status: 500 }
    )
  }
}

