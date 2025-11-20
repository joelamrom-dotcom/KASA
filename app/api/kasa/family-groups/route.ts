import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { FamilyGroup, Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get all groups for user
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    const groups = await FamilyGroup.find({ userId: userObjectId })
      .populate('families', 'name')
      .sort({ name: 1 })
      .lean()

    return NextResponse.json(groups.map((g: any) => ({
      ...g,
      _id: g._id.toString(),
      families: (g.families || []).map((f: any) => ({
        _id: f._id.toString(),
        name: f.name
      }))
    })))
  } catch (error: any) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or update group
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { _id, name, description, color, families } = body

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    if (_id) {
      // Update existing group
      const group = await FamilyGroup.findOneAndUpdate(
        { _id, userId: userObjectId },
        { name, description, color, families: families || [] },
        { new: true }
      )

      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 })
      }

      return NextResponse.json({
        ...group.toObject(),
        _id: group._id.toString()
      })
    } else {
      // Create new group
      const group = await FamilyGroup.create({
        userId: userObjectId,
        name,
        description,
        color: color || '#3b82f6',
        families: families || []
      })

      return NextResponse.json({
        ...group.toObject(),
        _id: group._id.toString()
      }, { status: 201 })
    }
  } catch (error: any) {
    console.error('Error saving group:', error)
    return NextResponse.json(
      { error: 'Failed to save group', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete group
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
      return NextResponse.json({ error: 'Group ID required' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    const group = await FamilyGroup.findOneAndDelete({ _id: id, userId: userObjectId })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Remove group from all families
    await Family.updateMany(
      { userId: userObjectId, groupId: id },
      { $unset: { groupId: '' } }
    )

    return NextResponse.json({ message: 'Group deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { error: 'Failed to delete group', details: error.message },
      { status: 500 }
    )
  }
}

