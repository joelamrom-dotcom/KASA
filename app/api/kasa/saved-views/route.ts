import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { SavedView } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')

    const query: any = {
      $or: [
        { userId: user.userId },
        { isPublic: true },
        { sharedWith: user.userId },
      ],
    }

    if (entityType) {
      query.entityType = entityType
    }

    const views = await SavedView.find(query)
      .sort({ isDefault: -1, createdAt: -1 })
      .lean()

    return NextResponse.json(views)
  } catch (error: any) {
    console.error('Error fetching saved views:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch saved views' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, filters, entityType, isDefault, isPublic } = body

    if (!name || !entityType) {
      return NextResponse.json(
        { error: 'Name and entityType are required' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults for this entity type
    if (isDefault) {
      await SavedView.updateMany(
        { userId: user.userId, entityType, isDefault: true },
        { $set: { isDefault: false } }
      )
    }

    const view = await SavedView.create({
      userId: user.userId,
      name,
      description,
      filters,
      entityType,
      isDefault: isDefault || false,
      isPublic: isPublic || false,
    })

    return NextResponse.json(view, { status: 201 })
  } catch (error: any) {
    console.error('Error creating saved view:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create saved view' },
      { status: 500 }
    )
  }
}

