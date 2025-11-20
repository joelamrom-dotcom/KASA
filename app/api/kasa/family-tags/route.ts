import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { FamilyTag } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get all tags for user
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    const tags = await FamilyTag.find({ userId: userObjectId })
      .sort({ name: 1 })
      .lean()

    return NextResponse.json(tags.map((t: any) => ({
      ...t,
      _id: t._id.toString()
    })))
  } catch (error: any) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or update tag
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { _id, name, color, description } = body

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    if (_id) {
      // Update existing tag
      const tag = await FamilyTag.findOneAndUpdate(
        { _id, userId: userObjectId },
        { name, color, description },
        { new: true }
      )

      if (!tag) {
        return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
      }

      return NextResponse.json({
        ...tag.toObject(),
        _id: tag._id.toString()
      })
    } else {
      // Create new tag
      const tag = await FamilyTag.create({
        userId: userObjectId,
        name,
        color: color || '#3b82f6',
        description
      })

      return NextResponse.json({
        ...tag.toObject(),
        _id: tag._id.toString()
      }, { status: 201 })
    }
  } catch (error: any) {
    console.error('Error saving tag:', error)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Tag with this name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to save tag', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete tag
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
      return NextResponse.json({ error: 'Tag ID required' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    const tag = await FamilyTag.findOneAndDelete({ _id: id, userId: userObjectId })

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // Remove tag from all families
    const { Family } = await import('@/lib/models')
    await Family.updateMany(
      { userId: userObjectId, tags: id },
      { $pull: { tags: id } }
    )

    return NextResponse.json({ message: 'Tag deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { error: 'Failed to delete tag', details: error.message },
      { status: 500 }
    )
  }
}

