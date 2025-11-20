import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { PaymentPlan } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

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
    
    // Build query - each user sees only their own settings
    const query: any = { _id: params.id, userId: user.userId }
    
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
    
    // Build query - each user sees only their own settings
    const query: any = { _id: params.id, userId: user.userId }
    
    // Get old plan data for audit log
    const oldPlan = await PaymentPlan.findOne(query)
    
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
    if (oldPlan && Object.keys(body).length > 0) {
      try {
        const { createAuditLog, getIpAddress, getUserAgent } = await import('@/lib/audit-log')
        const changedFields: any = {}
        
        Object.keys(body).forEach(key => {
          const oldValue = (oldPlan as any)[key]
          const newValue = body[key]
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changedFields[key] = { from: oldValue, to: newValue }
          }
        })
        
        if (Object.keys(changedFields).length > 0) {
          await createAuditLog({
            userId: user.userId,
            userEmail: user.email,
            userRole: user.role,
            action: 'payment_plan_update',
            entityType: 'payment_plan',
            entityId: params.id,
            entityName: plan.name,
            changes: changedFields,
            description: `Updated payment plan "${plan.name}" - Changed: ${Object.keys(changedFields).join(', ')}`,
            ipAddress: getIpAddress(request),
            userAgent: getUserAgent(request),
            metadata: {
              planName: plan.name,
            }
          })
        }
      } catch (auditError: any) {
        console.error('Error creating audit log:', auditError)
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
    
    // Build query - each user sees only their own settings
    const query: any = { _id: params.id, userId: user.userId }
    
    // Get plan data before deleting for audit log
    const plan = await PaymentPlan.findOne(query).lean()
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Payment plan not found' },
        { status: 404 }
      )
    }

    // Delete the plan
    await PaymentPlan.findOneAndDelete(query)

    // Create audit log entry
    try {
      const { createAuditLog, getIpAddress, getUserAgent } = await import('@/lib/audit-log')
      const planDoc = plan as { name: string; yearlyPrice?: number }
      await createAuditLog({
        userId: user.userId,
        userEmail: user.email,
        userRole: user.role,
        action: 'payment_plan_delete',
        entityType: 'payment_plan',
        entityId: params.id,
        entityName: planDoc.name,
        description: `Deleted payment plan "${planDoc.name}"`,
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
        metadata: {
          planName: planDoc.name,
          yearlyPrice: planDoc.yearlyPrice,
        }
      })
    } catch (auditError: any) {
      console.error('Error creating audit log:', auditError)
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

