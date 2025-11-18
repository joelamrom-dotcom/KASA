import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { LifecycleEvent } from '@/lib/models'
import { getAuthenticatedUser, isSuperAdmin } from '@/lib/middleware'

// GET - Get a specific lifecycle event type
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Build query - filter by userId unless super_admin
    const query: any = { _id: params.id }
    if (!isSuperAdmin(user)) {
      query.userId = user.userId
    }
    
    const eventType = await LifecycleEvent.findOne(query)
    
    if (!eventType) {
      return NextResponse.json(
        { error: 'Lifecycle event type not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(eventType)
  } catch (error: any) {
    console.error('Error fetching lifecycle event type:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lifecycle event type', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update a lifecycle event type
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { name, amount } = body

    if (!name || amount === undefined) {
      return NextResponse.json(
        { error: 'Name and amount are required' },
        { status: 400 }
      )
    }

    // Build query - filter by userId unless super_admin
    const query: any = { _id: params.id }
    if (!isSuperAdmin(user)) {
      query.userId = user.userId
    }

    const eventType = await LifecycleEvent.findOneAndUpdate(
      query,
      {
        name,
        amount: parseFloat(amount)
      },
      { new: true }
    )

    if (!eventType) {
      return NextResponse.json(
        { error: 'Lifecycle event type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(eventType)
  } catch (error: any) {
    console.error('Error updating lifecycle event type:', error)
    return NextResponse.json(
      { error: 'Failed to update lifecycle event type', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a lifecycle event type
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Build query - filter by userId unless super_admin
    const query: any = { _id: params.id }
    if (!isSuperAdmin(user)) {
      query.userId = user.userId
    }
    
    const eventType = await LifecycleEvent.findOneAndDelete(query)
    
    if (!eventType) {
      return NextResponse.json(
        { error: 'Lifecycle event type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Lifecycle event type deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting lifecycle event type:', error)
    return NextResponse.json(
      { error: 'Failed to delete lifecycle event type', details: error.message },
      { status: 500 }
    )
  }
}

