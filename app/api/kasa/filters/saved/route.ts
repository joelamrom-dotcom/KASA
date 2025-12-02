import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { SavedView } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get saved filters
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get('entityType') || 'family'

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const filters = await SavedView.find({ userId, entityType }).sort({ createdAt: -1 }).lean()

    return NextResponse.json({ filters })
  } catch (error: any) {
    console.error('Error fetching saved filters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filters', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Save filter
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, entityType, filters, isShared } = body

    if (!name || !entityType || !filters) {
      return NextResponse.json({ error: 'Name, entityType, and filters are required' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const savedFilter = await SavedView.create({
      userId,
      name,
      entityType,
      filters,
      isShared: isShared || false
    })

    return NextResponse.json({ filter: savedFilter })
  } catch (error: any) {
    console.error('Error saving filter:', error)
    return NextResponse.json(
      { error: 'Failed to save filter', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete saved filter
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const filterId = searchParams.get('id')

    if (!filterId) {
      return NextResponse.json({ error: 'Filter ID is required' }, { status: 400 })
    }

    await SavedView.findByIdAndDelete(filterId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting filter:', error)
    return NextResponse.json(
      { error: 'Failed to delete filter', details: error.message },
      { status: 500 }
    )
  }
}

