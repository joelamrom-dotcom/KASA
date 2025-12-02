import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { createApprovalWorkflow, approveWorkflowStep, rejectWorkflowStep, delegateApproval, escalateApproval } from '@/lib/workflow-engine'

export const dynamic = 'force-dynamic'

// POST - Create approval workflow
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { entityType, entityId, action, approvers } = body

    if (!entityType || !entityId || !action || !approvers || approvers.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const workflow = await createApprovalWorkflow(
      user.userId,
      entityType,
      entityId,
      action,
      approvers
    )

    return NextResponse.json({ workflow })
  } catch (error: any) {
    console.error('Error creating approval workflow:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Approve/reject workflow step
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workflowId, stepIndex, action, comments, delegateTo } = body

    if (action === 'approve') {
      await approveWorkflowStep(workflowId, stepIndex, user.userId, comments)
    } else if (action === 'reject') {
      await rejectWorkflowStep(workflowId, stepIndex, user.userId, comments)
    } else if (action === 'delegate' && delegateTo) {
      await delegateApproval(workflowId, stepIndex, user.userId, delegateTo)
    } else if (action === 'escalate') {
      await escalateApproval(workflowId, comments || 'Escalated')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow', details: error.message },
      { status: 500 }
    )
  }
}

