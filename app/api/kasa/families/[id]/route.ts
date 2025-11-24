import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { invalidateCache, CacheKeys } from '@/lib/cache'
import { Family, FamilyMember, Payment, Withdrawal, LifecycleEventPayment, PaymentPlan, User } from '@/lib/models'
import { calculateFamilyBalance } from '@/lib/calculations'
import { moveToRecycleBin } from '@/lib/recycle-bin'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

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
    
    // Check permission
    const canView = await hasPermission(user, PERMISSIONS.FAMILIES_VIEW)
    if (!canView && user.role !== 'family') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Check access - only super_admin can access any family, others only their own
    const isSuperAdmin = user.role === 'super_admin'
    const isFamilyOwner = family.userId?.toString() === user.userId
    const isFamilyMember = user.role === 'family' && user.familyId === params.id
    
    if (!isSuperAdmin && !isFamilyOwner && !isFamilyMember) {
      return NextResponse.json(
        { error: 'Forbidden - You can only access your own families' },
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
    
    // Check permission
    const canUpdate = await hasPermission(user, PERMISSIONS.FAMILIES_UPDATE)
    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Check access - only super_admin can update any family, others only their own
    const isSuperAdmin = user.role === 'super_admin'
    const isFamilyOwner = family.userId?.toString() === user.userId
    
    if (!isSuperAdmin && !isFamilyOwner) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own families' },
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
    
    // Check for duplicate email address if email is being updated
    // Validation depends on the logged-in user's role (admin vs family)
    if ('email' in body && body.email && body.email.trim()) {
      const emailLower = body.email.toLowerCase().trim()
      
      // If logged in as a family user, they can only update their own family's email to their own email
      if (user.role === 'family') {
        // Check if this is the user's own family
        if (family.userId?.toString() !== user.userId && family._id.toString() !== user.familyId) {
          return NextResponse.json(
            { 
              error: 'Family users can only update their own family',
              details: `You are logged in as a family user. You can only update your own family's information.`
            },
            { status: 403 } // 403 Forbidden
          )
        }
        
        // Family users can only set email to their own email
        if (emailLower !== user.email.toLowerCase().trim()) {
          return NextResponse.json(
            { 
              error: 'Family users can only use their own email address',
              details: `You are logged in as a family user with email "${user.email}". You can only set the family email to your own email address.`
            },
            { status: 403 } // 403 Forbidden
          )
        }
      }
      
      // Check if another family (other than this one) already has this email
      let emailQuery: any = { 
        email: emailLower,
        _id: { $ne: params.id } // Exclude current family
      }
      
      // If not super_admin, only check within user's own families
      if (user.role !== 'super_admin') {
        emailQuery.userId = user.userId
      }
      
      const existingFamilyWithEmail = await Family.findOne(emailQuery)
      
      if (existingFamilyWithEmail) {
        return NextResponse.json(
          { 
            error: 'A family with this email address already exists',
            details: `Email "${body.email}" is already associated with family "${existingFamilyWithEmail.name}"`,
            existingFamilyId: existingFamilyWithEmail._id.toString(),
            existingFamilyName: existingFamilyWithEmail.name
          },
          { status: 409 } // 409 Conflict
        )
      }
      
      // Check if a User account exists with this email (to prevent login conflicts)
      const existingUser = await User.findOne({ email: emailLower })
      if (existingUser) {
        // If logged in as admin/super_admin, check if email conflicts with existing user roles
        if (user.role === 'admin' || user.role === 'super_admin') {
          if (existingUser.role === 'family') {
            if (existingUser.familyId && existingUser.familyId.toString() !== params.id) {
              const linkedFamily = await Family.findById(existingUser.familyId)
              if (linkedFamily) {
                return NextResponse.json(
                  { 
                    error: 'This email address is already associated with a family account',
                    details: `Email "${body.email}" is already linked to family "${linkedFamily.name}" and is used for family login. Please use a different email.`,
                    existingFamilyId: linkedFamily._id.toString(),
                    existingFamilyName: linkedFamily.name,
                    loginType: 'family'
                  },
                  { status: 409 } // 409 Conflict
                )
              }
            }
          } else if (existingUser.role === 'admin' || existingUser.role === 'super_admin') {
            // If email belongs to another admin, allow it (admins can manage multiple families)
            // But warn if it's a different admin
            if (existingUser._id.toString() !== user.userId) {
              console.warn(`Admin ${user.email} is updating family ${params.id} with email ${body.email} that belongs to another admin ${existingUser.email}`)
            }
          }
        } else if (user.role === 'family') {
          // Family users can only use their own email
          if (existingUser._id.toString() !== user.userId) {
            return NextResponse.json(
              { 
                error: 'This email address belongs to another account',
                details: `Email "${body.email}" is already registered. Family users can only use their own email address.`
              },
              { status: 409 } // 409 Conflict
            )
          }
        }
      }
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
    
    // Check if payment plan changed
    const paymentPlanChanged = 'paymentPlanId' in body && 
      family.paymentPlanId?.toString() !== body.paymentPlanId
    
    // Check if balance changed (calculate new balance)
    const oldBalance = family.currentPayment || 0
    const { calculateFamilyBalance } = await import('@/lib/calculations')
    const newBalanceData = await calculateFamilyBalance(params.id)
    const newBalance = newBalanceData.balance
    const balanceChanged = Math.abs(oldBalance - newBalance) > 0.01
    
    // Trigger automation rules for family updated
    try {
      const { executeAutomationRules } = await import('@/lib/automation-engine')
      await executeAutomationRules(
        {
          type: 'family_updated',
          familyId: params.id,
          data: {
            changedFields: Object.keys(changedFields),
            paymentPlanChanged,
            balanceChanged,
            oldBalance,
            newBalance,
          },
        },
        user.userId
      )
      
      // Trigger payment plan changed if applicable
      if (paymentPlanChanged) {
        await executeAutomationRules(
          {
            type: 'payment_plan_changed',
            familyId: params.id,
            data: {
              oldPaymentPlanId: family.paymentPlanId?.toString(),
              newPaymentPlanId: body.paymentPlanId,
            },
          },
          user.userId
        )
      }
      
      // Trigger balance changed if applicable
      if (balanceChanged) {
        await executeAutomationRules(
          {
            type: 'family_balance_changed',
            familyId: params.id,
            data: {
              oldBalance,
              newBalance,
              difference: newBalance - oldBalance,
            },
          },
          user.userId
        )
        
        // Check for balance threshold triggers
        // Common thresholds: 1000, 2500, 5000, 10000
        const thresholds = [1000, 2500, 5000, 10000]
        for (const threshold of thresholds) {
          // Check if balance crossed threshold (either direction)
          const crossedThreshold = 
            (oldBalance < threshold && newBalance >= threshold) ||
            (oldBalance >= threshold && newBalance < threshold)
          
          if (crossedThreshold) {
            await executeAutomationRules(
              {
                type: 'balance_threshold',
                familyId: params.id,
                data: {
                  threshold,
                  oldBalance,
                  newBalance,
                  crossedAbove: newBalance >= threshold,
                },
              },
              user.userId
            )
          }
        }
      }
    } catch (automationError) {
      console.error('Error executing automation rules for family update:', automationError)
      // Don't fail the update if automation fails
    }
    
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
      await auditLogFromRequest(request, user, 'family_update', 'family', {
        entityId: params.id,
        entityName: updatedFamily.name,
        changes: changedFields,
        description: `Updated family "${updatedFamily.name}" - Changed: ${Object.keys(changedFields).join(', ')}`,
        metadata: {
          familyName: updatedFamily.name,
          changedFields: Object.keys(changedFields),
        }
      })
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
    
    // Check permission
    const canDelete = await hasPermission(user, PERMISSIONS.FAMILIES_DELETE)
    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Check access - only super_admin can delete any family, others only their own
    const isSuperAdmin = user.role === 'super_admin'
    const isFamilyOwner = family.userId?.toString() === user.userId
    
    if (!isSuperAdmin && !isFamilyOwner) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own families' },
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
    await auditLogFromRequest(request, user, 'family_delete', 'family', {
      entityId: params.id,
      entityName: family.name,
      description: `Deleted family "${family.name}" and moved to recycle bin`,
      metadata: {
        familyName: family.name,
        membersCount: members.length,
        paymentsCount: payments.length,
      }
    })

    // Now delete from database
    // Trigger automation rules for family deleted
    try {
      const { executeAutomationRules } = await import('@/lib/automation-engine')
      await executeAutomationRules(
        {
          type: 'family_deleted',
          familyId: params.id,
          data: {
            name: family.name,
            email: family.email,
          },
        },
        user.userId
      )
    } catch (automationError) {
      console.error('Error executing automation rules for family deletion:', automationError)
      // Don't fail the deletion if automation fails
    }

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

