import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { ScheduledReport, CustomReport } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

// GET - Get all scheduled reports for user
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission - users with reports.view see all scheduled reports, others see only their own
    const canViewAll = await hasPermission(user, PERMISSIONS.REPORTS_VIEW)
    
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    const query = canViewAll ? { isActive: true } : { userId: userObjectId, isActive: true }
    const scheduledReports = await ScheduledReport.find(query)
      .populate('reportId')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(scheduledReports.map((r: any) => ({
      ...r,
      _id: r._id.toString(),
      reportId: r.reportId?._id?.toString() || r.reportId
    })))
  } catch (error: any) {
    console.error('Error fetching scheduled reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled reports', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or update scheduled report
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.REPORTS_CREATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      _id,
      reportId,
      name,
      schedule,
      recipients,
      exportFormat
    } = body

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    // Calculate next run time
    const nextRun = calculateNextRun(schedule)

    if (_id) {
      // Update existing scheduled report
      const scheduledReport = await ScheduledReport.findOneAndUpdate(
        { _id, userId: userObjectId },
        {
          reportId,
          name,
          schedule,
          recipients,
          exportFormat,
          nextRun
        },
        { new: true }
      )

      if (!scheduledReport) {
        return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 })
      }

      // Create audit log entry
      await auditLogFromRequest(request, user, 'scheduled_report_update', 'scheduled_report', {
        entityId: _id,
        entityName: name,
        description: `Updated scheduled report "${name}"`,
        metadata: {
          reportId,
          schedule,
          recipients: recipients?.length || 0,
          exportFormat,
        }
      })

      return NextResponse.json({
        ...scheduledReport.toObject(),
        _id: scheduledReport._id.toString()
      })
    } else {
      // Create new scheduled report
      const scheduledReport = await ScheduledReport.create({
        userId: userObjectId,
        reportId,
        name,
        schedule,
        recipients,
        exportFormat,
        nextRun
      })
      
      // Create audit log entry
      await auditLogFromRequest(request, user, 'scheduled_report_create', 'scheduled_report', {
        entityId: scheduledReport._id.toString(),
        entityName: name,
        description: `Created scheduled report "${name}"`,
        metadata: {
          reportId,
          schedule,
          recipients: recipients?.length || 0,
          exportFormat,
        }
      })

      return NextResponse.json({
        ...scheduledReport.toObject(),
        _id: scheduledReport._id.toString()
      }, { status: 201 })
    }
  } catch (error: any) {
    console.error('Error saving scheduled report:', error)
    return NextResponse.json(
      { error: 'Failed to save scheduled report', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete scheduled report
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Scheduled report ID required' }, { status: 400 })
    }

    // Check permission or ownership
    const canDeleteAll = await hasPermission(user, PERMISSIONS.REPORTS_DELETE)
    
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    // Build query based on permissions
    const query: any = canDeleteAll ? { _id: id } : { _id: id, userId: userObjectId }
    
    const scheduledReport = await ScheduledReport.findOne(query)
    
    if (!scheduledReport) {
      return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 })
    }
    
    // Check ownership if user doesn't have delete permission
    if (!canDeleteAll && scheduledReport.userId?.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to delete this scheduled report' },
        { status: 403 }
      )
    }

    await ScheduledReport.findOneAndUpdate(
      query,
      { isActive: false },
      { new: true }
    )

    // Create audit log entry
    await auditLogFromRequest(request, user, 'scheduled_report_delete', 'scheduled_report', {
      entityId: id,
      entityName: scheduledReport.name,
      description: `Deleted scheduled report "${scheduledReport.name}"`,
      metadata: {
        reportId: scheduledReport.reportId?.toString(),
        schedule: scheduledReport.schedule,
      }
    })

    return NextResponse.json({ message: 'Scheduled report deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting scheduled report:', error)
    return NextResponse.json(
      { error: 'Failed to delete scheduled report', details: error.message },
      { status: 500 }
    )
  }
}

function calculateNextRun(schedule: any): Date {
  const now = new Date()
  const [hours, minutes] = schedule.time.split(':').map(Number)
  
  let nextRun = new Date()
  nextRun.setHours(hours, minutes, 0, 0)

  switch (schedule.frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      break
    case 'weekly':
      const dayOfWeek = schedule.dayOfWeek || 0
      const currentDay = nextRun.getDay()
      let daysUntilNext = (dayOfWeek - currentDay + 7) % 7
      if (daysUntilNext === 0 && nextRun <= now) {
        daysUntilNext = 7
      }
      nextRun.setDate(nextRun.getDate() + daysUntilNext)
      break
    case 'monthly':
      const dayOfMonth = schedule.dayOfMonth || 1
      nextRun.setDate(dayOfMonth)
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1)
      }
      break
    case 'quarterly':
      nextRun.setMonth(Math.floor(nextRun.getMonth() / 3) * 3, schedule.dayOfMonth || 1)
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 3)
      }
      break
    case 'yearly':
      nextRun.setMonth(0, schedule.dayOfMonth || 1)
      if (nextRun <= now) {
        nextRun.setFullYear(nextRun.getFullYear() + 1)
      }
      break
  }

  return nextRun
}

