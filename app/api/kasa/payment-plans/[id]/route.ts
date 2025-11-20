import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { PaymentPlan } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

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
    
    // Check permission or ownership
    const canViewAll = await hasPermission(user, PERMISSIONS.PAYMENT_PLANS_VIEW)
    
    // Build query - each user sees only their own settings unless they have permission
    const query: any = canViewAll ? { _id: params.id } : { _id: params.id, userId: user.userId }
    
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
    
    // Check permission or ownership
    const canUpdateAll = await hasPermission(user, PERMISSIONS.PAYMENT_PLANS_UPDATE)
    
    // Build query - each user sees only their own settings unless they have permission
    const query: any = canUpdateAll ? { _id: params.id } : { _id: params.id, userId: user.userId }
    
    // Get old plan data for audit log
    const oldPlan = await PaymentPlan.findOne(query)
    
    if (!oldPlan) {
      return NextResponse.json(
        { error: 'Payment plan not found' },
        { status: 404 }
      )
    }
    
    // Check ownership if user doesn't have update permission
    if (!canUpdateAll && oldPlan.userId?.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to update this payment plan' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
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

    // Create audit log entry
    if (Object.keys(body).length > 0) {
      const changedFields: any = {}
      
      Object.keys(body).forEach(key => {
        const oldValue = (oldPlan as any)[key]
        const newValue = body[key]
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changedFields[key] = { old: oldValue, new: newValue }
        }
      })
      
      if (Object.keys(changedFields).length > 0) {
        await auditLogFromRequest(request, user, 'payment_plan_update', 'payment_plan', {
          entityId: params.id,
          entityName: plan.name,
          changes: changedFields,
          description: `Updated payment plan "${plan.name}" - Changed: ${Object.keys(changedFields).join(', ')}`,
          metadata: {
            planName: plan.name,
            changedFields: Object.keys(changedFields),
          }
        })
      }
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
    
    // Check permission or ownership
    const canDeleteAll = await hasPermission(user, PERMISSIONS.PAYMENT_PLANS_DELETE)
    
    // Build query - each user sees only their own settings unless they have permission
    const query: any = canDeleteAll ? { _id: params.id } : { _id: params.id, userId: user.userId }
    
    // Get plan data before deleting for audit log
    const plan = await PaymentPlan.findOne(query).lean()
    
    if (!plan || Array.isArray(plan)) {
      return NextResponse.json(
        { error: 'Payment plan not found' },
        { status: 404 }
      )
    }
    
    // Check ownership if user doesn't have delete permission
    const planDoc = plan as { name?: string; yearlyPrice?: number; userId?: any }
    if (!canDeleteAll && planDoc.userId?.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to delete this payment plan' },
        { status: 403 }
      )
    }

    // Delete the plan
    await PaymentPlan.findOneAndDelete(query)

    // Create audit log entry
    await auditLogFromRequest(request, user, 'payment_plan_delete', 'payment_plan', {
      entityId: params.id,
      entityName: planDoc.name || 'Unknown',
      description: `Deleted payment plan "${planDoc.name || 'Unknown'}"`,
      metadata: {
        planName: planDoc.name || 'Unknown',
        yearlyPrice: planDoc.yearlyPrice,
      }
    })

    return NextResponse.json({ message: 'Payment plan deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting payment plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment plan', details: error.message },
      { status: 500 }
    )
  }
}

