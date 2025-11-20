import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { FamilyRelationship } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// DELETE - Delete a relationship
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; relationshipId: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    const relationship = await FamilyRelationship.findOneAndUpdate(
      { _id: params.relationshipId, userId: userObjectId },
      { isActive: false },
      { new: true }
    )

    if (!relationship) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Relationship deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting relationship:', error)
    return NextResponse.json(
      { error: 'Failed to delete relationship', details: error.message },
      { status: 500 }
    )
  }
}

