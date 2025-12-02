import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ReportComment } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

// POST - Resolve a comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    await connectDB()

    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasPermission(user, PERMISSIONS.REPORTS_UPDATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const comment = await ReportComment.findOneAndUpdate(
      {
        _id: params.commentId,
        reportId: params.id,
      },
      {
        resolved: true,
        resolvedBy: user.userId,
        resolvedAt: new Date(),
      },
      { new: true }
    )
      .populate('resolvedBy', 'firstName lastName')
      .lean()

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    return NextResponse.json({ comment })
  } catch (error: any) {
    console.error('Error resolving comment:', error)
    return NextResponse.json(
      { error: 'Failed to resolve comment', details: error.message },
      { status: 500 }
    )
  }
}

