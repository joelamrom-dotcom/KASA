import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Document } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Enhanced document search with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category')
    const tags = searchParams.get('tags')?.split(',')
    const limit = parseInt(searchParams.get('limit') || '50')

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const docQuery: any = { userId }
    
    if (query) {
      docQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }
    
    if (category) {
      docQuery.category = category
    }
    
    if (tags && tags.length > 0) {
      docQuery.tags = { $in: tags }
    }

    const documents = await Document.find(docQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json({
      documents: documents.map((d: any) => ({
        _id: d._id.toString(),
        name: d.name,
        description: d.description,
        category: d.category,
        tags: d.tags || [],
        fileUrl: d.fileUrl,
        fileSize: d.fileSize,
        createdAt: d.createdAt
      })),
      count: documents.length
    })
  } catch (error: any) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: error.message },
      { status: 500 }
    )
  }
}

