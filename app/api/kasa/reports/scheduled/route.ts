import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { ScheduledReport } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get scheduled reports
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const scheduledReports = await ScheduledReport.find({ userId })
      .populate('reportId')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ scheduledReports })
  } catch (error: any) {
    console.error('Error fetching scheduled reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled reports', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create scheduled report
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportId, name, schedule, recipients } = body

    if (!reportId || !name || !schedule) {
      return NextResponse.json({ error: 'Report ID, name, and schedule are required' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const scheduledReport = await ScheduledReport.create({
      userId,
      reportId,
      name,
      schedule,
      recipients: recipients || [],
      isActive: true
    })

    return NextResponse.json({ scheduledReport })
  } catch (error: any) {
    console.error('Error creating scheduled report:', error)
    return NextResponse.json(
      { error: 'Failed to create scheduled report', details: error.message },
      { status: 500 }
    )
  }
}
