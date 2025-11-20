import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { CustomReport, Payment, Family, LifecycleEvent, Withdrawal, Statement } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get all custom reports for user
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    
    const reports = await CustomReport.find({ userId: userObjectId, isActive: true })
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    const report = await CustomReport.findOneAndUpdate(
      { _id: id, userId: userObjectId },
      { isActive: false },
      { new: true }
    )

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Report deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting report:', error)
    return NextResponse.json(
      { error: 'Failed to delete report', details: error.message },
      { status: 500 }
    )
  }
}

