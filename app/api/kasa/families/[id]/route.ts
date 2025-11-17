import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, FamilyMember, Payment, Withdrawal, LifecycleEventPayment, PaymentPlan } from '@/lib/models'
import { calculateFamilyBalance } from '@/lib/calculations'
import { moveToRecycleBin } from '@/lib/recycle-bin'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

// GET - Get family by ID with full details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    // Get authenticated user
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const family = await Family.findById(params.id)
    
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }
    
    // Check ownership - admin can access all, regular users only their own, family users their own family
    const isFamilyOwner = family.userId?.toString() === user.userId
    const isFamilyMember = user.role === 'family' && user.familyId === params.id
    
    if (!isAdmin(user) && !isFamilyOwner && !isFamilyMember) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this family' },
        { status: 403 }
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
    
    // Get authenticated user
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if family exists and user has access
    const family = await Family.findById(params.id)
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }
    
    // Check ownership
    if (!isAdmin(user) && family.userId?.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this family' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    console.log('PUT /api/kasa/families/[id] - Received body:', JSON.stringify(body, null, 2))
    
    // Build update object explicitly to ensure all fields are included
    const updateData: any = {}
    
    // Handle all string fields - include them as-is (including empty strings)
    // This ensures Hebrew names and other fields are saved correctly
    if ('name' in body) updateData.name = body.name
    if ('hebrewName' in body) updateData.hebrewName = body.hebrewName
    if ('husbandFirstName' in body) updateData.husbandFirstName = body.husbandFirstName
    if ('husbandHebrewName' in body) updateData.husbandHebrewName = body.husbandHebrewName
    if ('husbandFatherHebrewName' in body) updateData.husbandFatherHebrewName = body.husbandFatherHebrewName
    if ('wifeFirstName' in body) updateData.wifeFirstName = body.wifeFirstName
    if ('wifeHebrewName' in body) updateData.wifeHebrewName = body.wifeHebrewName
    if ('wifeFatherHebrewName' in body) updateData.wifeFatherHebrewName = body.wifeFatherHebrewName
    if ('husbandCellPhone' in body) updateData.husbandCellPhone = body.husbandCellPhone
    if ('wifeCellPhone' in body) updateData.wifeCellPhone = body.wifeCellPhone
    if ('address' in body) updateData.address = body.address
    if ('street' in body) updateData.street = body.street
    if ('phone' in body) updateData.phone = body.phone
    if ('email' in body) updateData.email = body.email
    if ('city' in body) updateData.city = body.city
    if ('state' in body) updateData.state = body.state
    if ('zip' in body) updateData.zip = body.zip
    if ('currentPayment' in body) updateData.currentPayment = body.currentPayment || 0
    
    // Convert weddingDate to Date object if provided
    if ('weddingDate' in body && body.weddingDate) {
      updateData.weddingDate = new Date(body.weddingDate)
    }
    
    // Handle paymentPlanId separately
    if ('paymentPlanId' in body && body.paymentPlanId) {
      try {
        const paymentPlan = await PaymentPlan.findById(body.paymentPlanId)
        if (!paymentPlan) {
          return NextResponse.json(
            { error: `Payment plan with ID ${body.paymentPlanId} not found` },
            { status: 400 }
          )
        }
        updateData.paymentPlanId = paymentPlan._id
        console.log(`Updated family ${params.id} with payment plan ID: ${paymentPlan.name} (ID: ${body.paymentPlanId})`)
      } catch (error) {
        console.error('Error finding payment plan by ID:', error)
        return NextResponse.json(
          { error: 'Failed to find payment plan', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        )
      }
    }
    
    console.log('PUT /api/kasa/families/[id] - Update data:', JSON.stringify(updateData, null, 2))
    
    // Use $set to explicitly set all fields
    const family = await Family.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
    
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const updatedFamily = family.toObject()
    console.log('PUT /api/kasa/families/[id] - Updated family:', JSON.stringify({
      _id: updatedFamily._id,
      name: updatedFamily.name,
      hebrewName: updatedFamily.hebrewName,
      husbandHebrewName: updatedFamily.husbandHebrewName,
      husbandFatherHebrewName: updatedFamily.husbandFatherHebrewName,
      wifeHebrewName: updatedFamily.wifeHebrewName,
      wifeFatherHebrewName: updatedFamily.wifeFatherHebrewName
    }, null, 2))

    return NextResponse.json(family)
  } catch (error: any) {
    console.error('Error updating family:', error)
    return NextResponse.json(
      { error: 'Failed to update family', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete family (move to recycle bin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    // Get authenticated user
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const family = await Family.findById(params.id)
    
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }
    
    // Check ownership
    if (!isAdmin(user) && family.userId?.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this family' },
        { status: 403 }
      )
    }

    // Get related records to move to recycle bin
    const members = await FamilyMember.find({ familyId: params.id })
    const payments = await Payment.find({ familyId: params.id })
    const withdrawals = await Withdrawal.find({ familyId: params.id })
    const lifecycleEvents = await LifecycleEventPayment.find({ familyId: params.id })
    
    // Move related records to recycle bin
    for (const member of members) {
      await moveToRecycleBin('member', member._id.toString(), member.toObject())
    }
    for (const payment of payments) {
      await moveToRecycleBin('payment', payment._id.toString(), payment.toObject())
    }
    for (const withdrawal of withdrawals) {
      await moveToRecycleBin('withdrawal', withdrawal._id.toString(), withdrawal.toObject())
    }
    for (const event of lifecycleEvents) {
      await moveToRecycleBin('lifecycleEvent', event._id.toString(), event.toObject())
    }
    
    // Move family to recycle bin
    await moveToRecycleBin('family', params.id, family.toObject())
    
    // Now delete from database
    await FamilyMember.deleteMany({ familyId: params.id })
    await Payment.deleteMany({ familyId: params.id })
    await Withdrawal.deleteMany({ familyId: params.id })
    await LifecycleEventPayment.deleteMany({ familyId: params.id })
    await Family.findByIdAndDelete(params.id)

    return NextResponse.json({ message: 'Family moved to recycle bin successfully' })
  } catch (error: any) {
    console.error('Error deleting family:', error)
    return NextResponse.json(
      { error: 'Failed to delete family', details: error.message },
      { status: 500 }
    )
  }
}

