import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Comment } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get comments
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const query: any = {}
    if (entityType) query.entityType = entityType
    if (entityId) query.entityId = new mongoose.Types.ObjectId(entityId)

    const comments = await Comment.find(query)
      .populate('createdBy', 'name email')
      .populate('mentions', 'name email')
      .sort({ createdAt: 1 })
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

// POST - Add comment
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { entityType, entityId, comment, mentions } = body

    if (!entityType || !entityId || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const mentionIds = (mentions || []).map((id: string) => new mongoose.Types.ObjectId(id))

    const commentData = await Comment.create({
      userId,
      entityType,
      entityId: new mongoose.Types.ObjectId(entityId),
      comment,
      mentions: mentionIds,
      createdBy: userId
    })

    const populated = await Comment.findById(commentData._id)
      .populate('createdBy', 'name email')
      .populate('mentions', 'name email')
      .lean()

    return NextResponse.json({ comment: populated })
  } catch (error: any) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment', details: error.message },
      { status: 500 }
    )
  }
}

