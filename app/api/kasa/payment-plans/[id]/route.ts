import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { PaymentPlan } from '@/lib/models'

// GET - Get payment plan by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const plan = await PaymentPlan.findById(params.id)
    
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
    const body = await request.json()
    
    const plan = await PaymentPlan.findByIdAndUpdate(
      params.id,
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
    
    const plan = await PaymentPlan.findByIdAndDelete(params.id)
    
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

