import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, FamilyMember, Payment, Withdrawal, LifecycleEventPayment } from '@/lib/models'
import { calculateFamilyBalance } from '@/lib/calculations'

// GET - Get family by ID with full details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const family = await Family.findById(params.id)
    
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    // Get related data
    const members = await FamilyMember.find({ familyId: family._id })
    const payments = await Payment.find({ familyId: family._id }).sort({ paymentDate: -1 })
    const withdrawals = await Withdrawal.find({ familyId: family._id }).sort({ withdrawalDate: -1 })
    const lifecycleEvents = await LifecycleEventPayment.find({ familyId: family._id }).sort({ eventDate: -1 })
    
    // Calculate current balance
    const balance = await calculateFamilyBalance(family._id.toString())

    return NextResponse.json({
      family: family.toObject(),
      members,
      payments,
      withdrawals,
      lifecycleEvents,
      balance
    })
  } catch (error: any) {
    console.error('Error fetching family:', error)
    return NextResponse.json(
      { error: 'Failed to fetch family', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update family
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const body = await request.json()
    
    const family = await Family.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    )
    
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(family)
  } catch (error: any) {
    console.error('Error updating family:', error)
    return NextResponse.json(
      { error: 'Failed to update family', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete family
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    // Delete related records first
    await FamilyMember.deleteMany({ familyId: params.id })
    await Payment.deleteMany({ familyId: params.id })
    await Withdrawal.deleteMany({ familyId: params.id })
    await LifecycleEventPayment.deleteMany({ familyId: params.id })
    
    const family = await Family.findByIdAndDelete(params.id)
    
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Family deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting family:', error)
    return NextResponse.json(
      { error: 'Failed to delete family', details: error.message },
      { status: 500 }
    )
  }
}

