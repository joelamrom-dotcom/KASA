import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { SavedView } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get saved searches
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get('entityType')

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const query: any = { userId, type: 'search' }
    if (entityType) query.entityType = entityType

    const savedSearches = await SavedView.find(query).sort({ createdAt: -1 }).lean()

    return NextResponse.json({ searches: savedSearches })
  } catch (error: any) {
    console.error('Error fetching saved searches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch searches', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Save search
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, entityType, filters, query } = body

    if (!name || !entityType) {
      return NextResponse.json({ error: 'Name and entityType are required' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const savedSearch = await SavedView.create({
      userId,
      name,
      entityType,
      type: 'search',
      filters: filters || {},
      query: query || ''
    })

    return NextResponse.json({ search: savedSearch })
  } catch (error: any) {
    console.error('Error saving search:', error)
    return NextResponse.json(
      { error: 'Failed to save search', details: error.message },
      { status: 500 }
    )
  }
}

