import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Withdrawal, Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

// GET - Get all withdrawals for a family
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const withdrawals = await Withdrawal.find({ familyId: id })
      .sort({ withdrawalDate: -1 })
      .lean()
    
    return NextResponse.json(withdrawals)
  } catch (error: any) {
    console.error('Error fetching withdrawals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new withdrawal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    // Check if family exists
    const family = await Family.findById(id)
    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }
    
    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.PAYMENTS_CREATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const { amount, withdrawalDate, reason, notes } = body
    
    if (!amount || !withdrawalDate) {
      return NextResponse.json(
        { error: 'Amount and withdrawal date are required' },
        { status: 400 }
      )
    }
    
    const withdrawal = await Withdrawal.create({
      familyId: id,
      amount: parseFloat(amount),
      withdrawalDate: new Date(withdrawalDate),
      reason: reason || undefined,
      notes: notes || undefined,
    })
    
    // Trigger automation rules for withdrawal created
    try {
      const { executeAutomationRules } = await import('@/lib/automation-engine')
      await executeAutomationRules(
        {
          type: 'withdrawal_created',
          familyId: id,
          data: {
            amount: withdrawal.amount,
            withdrawalDate: withdrawal.withdrawalDate,
            reason: withdrawal.reason,
          },
        },
        user.userId
      )
    } catch (automationError) {
      console.error('Error executing automation rules for withdrawal:', automationError)
      // Don't fail the withdrawal creation if automation fails
    }
    
    // Create audit log entry
    await auditLogFromRequest(request, user, 'withdrawal_create', 'withdrawal', {
      entityId: withdrawal._id.toString(),
      entityName: `Withdrawal of $${amount}`,
      description: `Created withdrawal of $${amount} for family "${family.name}"`,
      metadata: {
        familyId: id,
        familyName: family.name,
        amount: withdrawal.amount,
        withdrawalDate: withdrawal.withdrawalDate,
      }
    })
    
    return NextResponse.json(withdrawal, { status: 201 })
  } catch (error: any) {
    console.error('Error creating withdrawal:', error)
    return NextResponse.json(
      { error: 'Failed to create withdrawal', details: error.message },
      { status: 500 }
    )
  }
}
