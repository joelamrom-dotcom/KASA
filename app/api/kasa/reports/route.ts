import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Report } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

// GET - Get all reports (filtered by user)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Get authenticated user
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check permission - users with reports.view see all, others see only their reports
    const canViewAll = await hasPermission(user, PERMISSIONS.REPORTS_VIEW)
    const query = canViewAll ? {} : { userId: user.userId }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(reports.map((report: any) => ({
      ...report,
      _id: report._id.toString()
    })))
  } catch (error: any) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new report from chat conversation
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Get authenticated user
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.REPORTS_CREATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, question, answer, reportType, metadata, tags, notes } = body

    if (!title || !question || !answer) {
      return NextResponse.json(
        { error: 'Title, question, and answer are required' },
        { status: 400 }
      )
    }

    const report = await Report.create({
      userId: user.userId, // Associate report with user
      title,
      question,
      answer,
      reportType: reportType || 'chat',
      metadata: metadata || {},
      tags: tags || [],
      notes: notes || ''
    })

    // Create audit log entry
    await auditLogFromRequest(request, user, 'report_create', 'report', {
      entityId: report._id.toString(),
      entityName: title,
      description: `Created report "${title}"`,
      metadata: {
        reportType: reportType || 'chat',
        tags: tags || [],
      }
    })

    return NextResponse.json({
      message: 'Report created successfully',
      report: {
        ...report.toObject(),
        _id: report._id.toString()
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Failed to create report', details: error.message },
      { status: 500 }
    )
  }
}

