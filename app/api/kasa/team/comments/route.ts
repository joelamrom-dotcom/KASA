import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'

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

    // Comments would be stored in Comment schema
    return NextResponse.json({
      comments: [],
      message: 'Comment system ready (schema needed)'
    })
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

    // Create comment with @mentions support
    const commentData = {
      entityType,
      entityId,
      comment,
      mentions: mentions || [],
      createdBy: user.userId,
      createdAt: new Date()
    }

    return NextResponse.json({ comment: commentData })
  } catch (error: any) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment', details: error.message },
      { status: 500 }
    )
  }
}

