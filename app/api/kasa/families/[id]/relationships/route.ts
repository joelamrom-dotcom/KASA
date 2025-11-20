import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { FamilyRelationship, Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get all relationships for a family
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

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    const familyId = new mongoose.Types.ObjectId(params.id)

    const relationships = await FamilyRelationship.find({
      userId: userObjectId,
      isActive: true,
      $or: [
        { familyId1: familyId },
        { familyId2: familyId }
      ]
    })
      .populate('familyId1', 'name')
      .populate('familyId2', 'name')
      .lean()

    return NextResponse.json(relationships.map((r: any) => ({
      ...r,
      _id: r._id.toString(),
      familyId1: r.familyId1?._id?.toString(),
      familyId2: r.familyId2?._id?.toString(),
      family1Name: (r.familyId1 as any)?.name,
      family2Name: (r.familyId2 as any)?.name
    })))
  } catch (error: any) {
    console.error('Error fetching relationships:', error)
    return NextResponse.json(
      { error: 'Failed to fetch relationships', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a relationship
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

    const body = await request.json()
    const { relatedFamilyId, relationshipType, customType, notes } = body

    if (!relatedFamilyId || !relationshipType) {
      return NextResponse.json(
        { error: 'relatedFamilyId and relationshipType are required' },
        { status: 400 }
      )
    }

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    const familyId1 = new mongoose.Types.ObjectId(params.id)
    const familyId2 = new mongoose.Types.ObjectId(relatedFamilyId)

    // Check if relationship already exists
    const existing = await FamilyRelationship.findOne({
      userId: userObjectId,
      $or: [
        { familyId1: familyId1, familyId2: familyId2 },
        { familyId1: familyId2, familyId2: familyId1 }
      ]
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Relationship already exists' },
        { status: 400 }
      )
    }

    const relationship = await FamilyRelationship.create({
      userId: userObjectId,
      familyId1: familyId1,
      familyId2: familyId2,
      relationshipType,
      customType: relationshipType === 'custom' ? customType : undefined,
      notes
    })

    return NextResponse.json({
      ...relationship.toObject(),
      _id: relationship._id.toString()
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating relationship:', error)
    return NextResponse.json(
      { error: 'Failed to create relationship', details: error.message },
      { status: 500 }
    )
  }
}

