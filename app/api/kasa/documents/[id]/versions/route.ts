import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Document } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get document versions
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
    const documentId = new mongoose.Types.ObjectId(params.id)
    const userId = new mongoose.Types.ObjectId(user.userId)

    const document = await Document.findOne({ _id: documentId, userId }).lean()
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get all versions (parent document and child versions)
    const versions = await Document.find({
      $or: [
        { _id: documentId },
        { parentDocumentId: documentId }
      ],
      userId
    })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ versions })
  } catch (error: any) {
    console.error('Error fetching versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch versions', details: error.message },
      { status: 500 }
    )
  }
}

