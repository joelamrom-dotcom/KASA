import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { CustomReport, Payment, Family, LifecycleEvent, Withdrawal, Statement } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

// GET - Get all custom reports for user
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission - users with reports.view see all custom reports, others see only their own
    const canViewAll = await hasPermission(user, PERMISSIONS.REPORTS_VIEW)
    
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    const query = canViewAll ? { isActive: true } : { userId: userObjectId, isActive: true }
    const reports = await CustomReport.find(query)
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(reports.map((r: any) => ({
      ...r,
      _id: r._id.toString()
    })))
  } catch (error: any) {
    console.error('Error fetching custom reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or update custom report
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
      name,
      description,
      fields,
      filters,
      dateRange,
      groupBy,
      sortBy,
      sortOrder,
      comparison,
      exportSettings
    } = body

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    if (_id) {
      // Update existing report
      const report = await CustomReport.findOneAndUpdate(
        { _id, userId: userObjectId },
        {
          name,
          description,
          fields,
          filters,
          dateRange,
          groupBy,
          sortBy,
          sortOrder,
          comparison,
          exportSettings
        },
        { new: true }
      )

      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }

      // Create audit log entry
      await auditLogFromRequest(request, user, 'custom_report_update', 'custom_report', {
        entityId: _id,
        entityName: name,
        description: `Updated custom report "${name}"`,
        metadata: {
          fieldsCount: fields?.length || 0,
          hasFilters: !!filters,
          dateRange: dateRange?.type,
        }
      })

      return NextResponse.json({
        ...report.toObject(),
        _id: report._id.toString()
      })
    } else {
      // Create new report
      const report = await CustomReport.create({
        userId: userObjectId,
        name,
        description,
        fields,
        filters,
        dateRange,
        groupBy,
        sortBy,
        sortOrder,
        comparison,
        exportSettings
      })

      // Create audit log entry
      await auditLogFromRequest(request, user, 'custom_report_create', 'custom_report', {
        entityId: report._id.toString(),
        entityName: name,
        description: `Created custom report "${name}"`,
        metadata: {
          fieldsCount: fields?.length || 0,
          hasFilters: !!filters,
          dateRange: dateRange?.type,
        }
      })

      return NextResponse.json({
        ...report.toObject(),
        _id: report._id.toString()
      }, { status: 201 })
    }
  } catch (error: any) {
    console.error('Error saving custom report:', error)
    return NextResponse.json(
      { error: 'Failed to save report', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete custom report
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission or ownership
    const canDeleteAll = await hasPermission(user, PERMISSIONS.REPORTS_DELETE)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    // Build query based on permissions
    const query: any = canDeleteAll ? { _id: id } : { _id: id, userId: userObjectId }
    
    const report = await CustomReport.findOne(query)

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    
    // Check ownership if user doesn't have delete permission
    if (!canDeleteAll && report.userId?.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to delete this report' },
        { status: 403 }
      )
    }

    await CustomReport.findOneAndUpdate(
      query,
      { isActive: false },
      { new: true }
    )

    // Create audit log entry
    await auditLogFromRequest(request, user, 'custom_report_delete', 'custom_report', {
      entityId: id,
      entityName: report.name,
      description: `Deleted custom report "${report.name}"`,
      metadata: {
        reportName: report.name,
      }
    })

    return NextResponse.json({ message: 'Report deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting report:', error)
    return NextResponse.json(
      { error: 'Failed to delete report', details: error.message },
      { status: 500 }
    )
  }
}

