import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ReportComment } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

// GET - Get all comments for a report
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

    const comments = await ReportComment.find({ reportId: params.id })
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName email')
      .populate('parentCommentId')
      .populate('resolvedBy', 'firstName lastName')
      .lean()

    return NextResponse.json({ comments })
  } catch (error: any) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new comment
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
    const { comment, cellReference, isGeneral, parentCommentId, mentions } = body

    if (!comment) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 })
    }

    const reportComment = await ReportComment.create({
      reportId: params.id,
      userId: user.userId,
      comment,
      cellReference,
      isGeneral: isGeneral || false,
      parentCommentId: parentCommentId ? new mongoose.Types.ObjectId(parentCommentId) : undefined,
      mentions: mentions ? mentions.map((id: string) => new mongoose.Types.ObjectId(id)) : [],
    })

    const populated = await ReportComment.findById(reportComment._id)
      .populate('userId', 'firstName lastName email')
      .lean()

    return NextResponse.json({ comment: populated }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment', details: error.message },
      { status: 500 }
    )
  }
}

