import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { PaymentPlan } from '@/lib/models'
import { getAuthenticatedUser, isSuperAdmin } from '@/lib/middleware'

// GET - Get payment plan by ID
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
    
    const plan = await PaymentPlan.findOne(query)
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Payment plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(plan)
  } catch (error: any) {
    console.error('Error fetching payment plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment plan', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update payment plan
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
    
    // Build query - filter by userId unless super_admin
    const query: any = { _id: params.id }
    if (!isSuperAdmin(user)) {
      query.userId = user.userId
    }
    
    const plan = await PaymentPlan.findOneAndUpdate(
      query,
      body,
      { new: true, runValidators: true }
    )
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Payment plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(plan)
  } catch (error: any) {
    console.error('Error updating payment plan:', error)
    return NextResponse.json(
      { error: 'Failed to update payment plan', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete payment plan
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
    
    const plan = await PaymentPlan.findOneAndDelete(query)
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Payment plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Payment plan deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting payment plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment plan', details: error.message },
      { status: 500 }
    )
  }
}

