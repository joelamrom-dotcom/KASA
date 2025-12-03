import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ReportBookmark } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

// GET - Get all bookmarks for a report
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

    const bookmarks = await ReportBookmark.find({
      reportId: params.id,
      userId: user.userId,
    })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ bookmarks })
  } catch (error: any) {
    console.error('Error fetching bookmarks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a bookmark
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

    if (!(await hasPermission(user, PERMISSIONS.REPORTS_VIEW))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, filters, dateRange, viewSettings, notes, tags } = body

    // Check if bookmark already exists
    const existing = await ReportBookmark.findOne({
      reportId: params.id,
      userId: user.userId,
    })

    if (existing) {
      // Update existing bookmark
      existing.name = name || existing.name
      existing.filters = filters || existing.filters
      existing.dateRange = dateRange || existing.dateRange
      existing.viewSettings = viewSettings || existing.viewSettings
      existing.notes = notes || existing.notes
      existing.tags = tags || existing.tags
      await existing.save()

      return NextResponse.json({ bookmark: existing })
    }

    const bookmark = await ReportBookmark.create({
      reportId: params.id,
      userId: user.userId,
      name: name || 'Bookmark',
      filters,
      dateRange,
      viewSettings,
      notes,
      tags: tags || [],
    })

    return NextResponse.json({ bookmark }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to create bookmark', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a bookmark
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
    const bookmarkId = searchParams.get('bookmarkId')

    if (!bookmarkId) {
      return NextResponse.json({ error: 'bookmarkId is required' }, { status: 400 })
    }

    await ReportBookmark.deleteOne({
      _id: bookmarkId,
      reportId: params.id,
      userId: user.userId,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to delete bookmark', details: error.message },
      { status: 500 }
    )
  }
}

