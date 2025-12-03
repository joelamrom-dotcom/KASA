import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ReportAlert } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

// GET - Get all alerts for a report
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

    const alerts = await ReportAlert.find({
      reportId: params.id,
      userId: user.userId,
    })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ alerts })
  } catch (error: any) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new alert
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
    const {
      name,
      description,
      conditions,
      frequency,
      notificationType,
      recipients,
    } = body

    if (!name || !conditions || conditions.length === 0) {
      return NextResponse.json(
        { error: 'Name and at least one condition are required' },
        { status: 400 }
      )
    }

    const alert = await ReportAlert.create({
      reportId: params.id,
      userId: user.userId,
      name,
      description,
      conditions,
      frequency: frequency || { type: 'daily', time: '09:00' },
      notificationType: notificationType || 'email',
      recipients: recipients || [],
      isActive: true,
    })

    return NextResponse.json({ alert }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating alert:', error)
    return NextResponse.json(
      { error: 'Failed to create alert', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update an alert
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

    const body = await request.json()
    const { alertId, ...updates } = body

    if (!alertId) {
      return NextResponse.json({ error: 'alertId is required' }, { status: 400 })
    }

    const alert = await ReportAlert.findOneAndUpdate(
      {
        _id: alertId,
        reportId: params.id,
        userId: user.userId,
      },
      updates,
      { new: true }
    )

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    return NextResponse.json({ alert })
  } catch (error: any) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      { error: 'Failed to update alert', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete an alert
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('alertId')

    if (!alertId) {
      return NextResponse.json({ error: 'alertId is required' }, { status: 400 })
    }

    await ReportAlert.deleteOne({
      _id: alertId,
      reportId: params.id,
      userId: user.userId,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting alert:', error)
    return NextResponse.json(
      { error: 'Failed to delete alert', details: error.message },
      { status: 500 }
    )
  }
}

