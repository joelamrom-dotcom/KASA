import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { ScheduledReport, CustomReport } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get all scheduled reports for user
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    const scheduledReports = await ScheduledReport.find({ userId: userObjectId, isActive: true })
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

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    const scheduledReport = await ScheduledReport.findOneAndUpdate(
      { _id: id, userId: userObjectId },
      { isActive: false },
      { new: true }
    )

    if (!scheduledReport) {
      return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 })
    }

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

