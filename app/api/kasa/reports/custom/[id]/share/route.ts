import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { CustomReport } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// POST - Share report with users
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

    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.REPORTS_CREATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userIds, permission } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
      )
    }

    const mongoose = require('mongoose')
    const reportId = new mongoose.Types.ObjectId(params.id)

    // Get report
    const report = await CustomReport.findById(reportId)
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Update sharedWith field
    const sharedWith = report.sharedWith || []
    const newSharedWith = [...new Set([...sharedWith, ...userIds.map((id: string) => new mongoose.Types.ObjectId(id))])]

    await CustomReport.findByIdAndUpdate(reportId, {
      sharedWith: newSharedWith
    })

    return NextResponse.json({
      success: true,
      message: `Report shared with ${userIds.length} user(s)`,
      sharedWith: newSharedWith
    })
  } catch (error: any) {
    console.error('Error sharing report:', error)
    return NextResponse.json(
      { error: 'Failed to share report', details: error.message },
      { status: 500 }
    )
  }
}

