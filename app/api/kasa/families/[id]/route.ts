import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { invalidateCache, CacheKeys } from '@/lib/cache'
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
    
    // Store old values for audit log
    const oldValues: any = {}
    const newValues: any = {}
    const changedFields: any = {}
    
    // Build update object explicitly to ensure all fields are included
    const updateData: any = {}
    
    // Handle all string fields - include them as-is (including empty strings)
    // This ensures Hebrew names and other fields are saved correctly
    // Track changes for audit log
    const fieldsToTrack = [
      'name', 'hebrewName', 'husbandFirstName', 'husbandHebrewName', 'husbandFatherHebrewName',
      'wifeFirstName', 'wifeHebrewName', 'wifeFatherHebrewName', 'husbandCellPhone', 'wifeCellPhone',
      'address', 'street', 'phone', 'email', 'city', 'state', 'zip', 'currentPayment',
      'receiveEmails', 'receiveSMS'
    ]
    
    fieldsToTrack.forEach(field => {
      if (field in body) {
        const oldValue = (family as any)[field]
        const newValue = field === 'receiveEmails' || field === 'receiveSMS' 
          ? body[field] !== false 
          : body[field] || 0
        
        if (oldValue !== newValue) {
          oldValues[field] = oldValue
          newValues[field] = newValue
          changedFields[field] = { from: oldValue, to: newValue }
        }
        updateData[field] = newValue
      }
    })
    
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
    const updatedFamily = await Family.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
    
    if (!updatedFamily) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const familyObj = updatedFamily.toObject()
    console.log('PUT /api/kasa/families/[id] - Updated family:', JSON.stringify({
      _id: familyObj._id,
      name: familyObj.name,
      hebrewName: familyObj.hebrewName,
      husbandHebrewName: familyObj.husbandHebrewName,
      husbandFatherHebrewName: familyObj.husbandFatherHebrewName,
      wifeHebrewName: familyObj.wifeHebrewName,
      wifeFatherHebrewName: familyObj.wifeFatherHebrewName
    }, null, 2))

    // Create audit log entry
    if (Object.keys(changedFields).length > 0) {
      try {
        const { createAuditLog, getIpAddress, getUserAgent } = await import('@/lib/audit-log')
        const { User } = await import('@/lib/models')
        const userDoc = await User.findById(user.userId)
        
        await createAuditLog({
          userId: user.userId,
          userEmail: user.email,
          userRole: user.role,
          action: 'family_update',
          entityType: 'family',
          entityId: params.id,
          entityName: updatedFamily.name,
          changes: changedFields,
          description: `Updated family "${updatedFamily.name}" - Changed: ${Object.keys(changedFields).join(', ')}`,
          ipAddress: getIpAddress(request),
          userAgent: getUserAgent(request),
          metadata: {
            familyName: updatedFamily.name,
            changedFields: Object.keys(changedFields),
          }
        })
      } catch (auditError: any) {
        console.error('Error creating audit log:', auditError)
        // Don't fail the update if audit logging fails
      }
    }

    return NextResponse.json(updatedFamily)
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
    
    // Create audit log entry before deletion
    try {
      const { createAuditLog, getIpAddress, getUserAgent } = await import('@/lib/audit-log')
      await createAuditLog({
        userId: user.userId,
        userEmail: user.email,
        userRole: user.role,
        action: 'family_delete',
        entityType: 'family',
        entityId: params.id,
        entityName: family.name,
        description: `Deleted family "${family.name}" and moved to recycle bin`,
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
        metadata: {
          familyName: family.name,
          membersCount: members.length,
          paymentsCount: payments.length,
        }
      })
    } catch (auditError: any) {
      console.error('Error creating audit log:', auditError)
      // Don't fail deletion if audit logging fails
    }

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

