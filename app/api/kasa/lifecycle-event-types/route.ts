import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { LifecycleEvent } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

// GET - Get all lifecycle event types
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Build query - each user sees only their own settings
    const query = { userId: user.userId }
    const eventTypes = await LifecycleEvent.find(query).sort({ name: 1 })
    return NextResponse.json(eventTypes)
  } catch (error: any) {
    console.error('Error fetching lifecycle event types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lifecycle event types', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new lifecycle event type
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { type, name, amount } = body

    if (!type || !name || amount === undefined) {
      return NextResponse.json(
        { error: 'Type, name, and amount are required' },
        { status: 400 }
      )
    }

    // Check if type already exists for this user
    const query = { userId: user.userId, type }
    const existing = await LifecycleEvent.findOne(query)
    if (existing) {
      return NextResponse.json(
        { error: 'Event type already exists' },
        { status: 400 }
      )
    }

    const eventType = await LifecycleEvent.create({
      userId: user.userId, // All users (including super_admins) have their own settings
      type,
      name,
      amount: parseFloat(amount)
    })

    return NextResponse.json(eventType, { status: 201 })
  } catch (error: any) {
    console.error('Error creating lifecycle event type:', error)
    return NextResponse.json(
      { error: 'Failed to create lifecycle event type', details: error.message },
      { status: 500 }
    )
  }
}

