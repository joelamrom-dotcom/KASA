import connectDB from './database'
import { AuditLog, ApprovalWorkflow, User } from './models'

export interface ApprovalStep {
  approverId: string
  approverEmail?: string
  status: 'pending' | 'approved' | 'rejected' | 'delegated'
  comments?: string
  approvedAt?: Date
  delegatedTo?: string
}

/**
 * Create approval workflow
 */
export async function createApprovalWorkflow(
  userId: string,
  entityType: string,
  entityId: string,
  action: string,
  approvers: string[]
): Promise<any> {
  await connectDB()

  const mongoose = require('mongoose')
  const userIdObj = new mongoose.Types.ObjectId(userId)

  // Get approver emails
  const approverUsers = await User.find({ _id: { $in: approvers.map((id: string) => new mongoose.Types.ObjectId(id)) } })
    .select('email')
    .lean()

  const approverMap = new Map(approverUsers.map((u: any) => [u._id.toString(), u.email]))

  const steps = approvers.map(approverId => ({
    approverId: new mongoose.Types.ObjectId(approverId),
    approverEmail: approverMap.get(approverId),
    status: 'pending'
  }))

  const workflow = await ApprovalWorkflow.create({
    userId: userIdObj,
    entityType,
    entityId: new mongoose.Types.ObjectId(entityId),
    action,
    steps,
    currentStep: 0,
    status: 'pending',
    createdBy: userIdObj
  })

  return workflow
}

/**
 * Approve workflow step
 */
export async function approveWorkflowStep(
  workflowId: string,
  stepIndex: number,
  approverId: string,
  comments?: string
): Promise<any> {
  await connectDB()

  const mongoose = require('mongoose')
  const workflowIdObj = new mongoose.Types.ObjectId(workflowId)
  const approverIdObj = new mongoose.Types.ObjectId(approverId)

  const workflow = await ApprovalWorkflow.findById(workflowIdObj)
  if (!workflow) {
    throw new Error('Workflow not found')
  }

  if (stepIndex >= workflow.steps.length) {
    throw new Error('Invalid step index')
  }

  const step = workflow.steps[stepIndex]
  if (step.approverId.toString() !== approverId) {
    throw new Error('Not authorized to approve this step')
  }

  step.status = 'approved'
  step.comments = comments
  step.approvedAt = new Date()

  // Move to next step or complete
  if (workflow.currentStep < workflow.steps.length - 1) {
    workflow.currentStep++
  } else {
    workflow.status = 'approved'
    workflow.completedAt = new Date()
  }

  await workflow.save()

  return workflow
}

/**
 * Reject workflow step
 */
export async function rejectWorkflowStep(
  workflowId: string,
  stepIndex: number,
  approverId: string,
  comments?: string
): Promise<any> {
  await connectDB()

  const mongoose = require('mongoose')
  const workflowIdObj = new mongoose.Types.ObjectId(workflowId)

  const workflow = await ApprovalWorkflow.findById(workflowIdObj)
  if (!workflow) {
    throw new Error('Workflow not found')
  }

  const step = workflow.steps[stepIndex]
  if (step.approverId.toString() !== approverId) {
    throw new Error('Not authorized to reject this step')
  }

  step.status = 'rejected'
  step.comments = comments
  step.approvedAt = new Date()

  workflow.status = 'rejected'
  workflow.completedAt = new Date()

  await workflow.save()

  return workflow
}

/**
 * Delegate approval
 */
export async function delegateApproval(
  workflowId: string,
  stepIndex: number,
  fromUserId: string,
  toUserId: string
): Promise<void> {
  await connectDB()

  const mongoose = require('mongoose')
  const workflowIdObj = new mongoose.Types.ObjectId(workflowId)
  const toUserIdObj = new mongoose.Types.ObjectId(toUserId)

  const workflow = await ApprovalWorkflow.findById(workflowIdObj)
  if (!workflow) {
    throw new Error('Workflow not found')
  }

  const step = workflow.steps[stepIndex]
  if (step.approverId.toString() !== fromUserId) {
    throw new Error('Not authorized to delegate this step')
  }

  const toUser = await User.findById(toUserIdObj).select('email').lean()
  step.status = 'delegated'
  step.delegatedTo = toUserIdObj
  step.approverId = toUserIdObj
  step.approverEmail = (toUser as any)?.email

  await workflow.save()
}

/**
 * Escalate approval
 */
export async function escalateApproval(
  workflowId: string,
  reason: string
): Promise<void> {
  await connectDB()

  const mongoose = require('mongoose')
  const workflowIdObj = new mongoose.Types.ObjectId(workflowId)

  const workflow = await ApprovalWorkflow.findById(workflowIdObj)
  if (!workflow) {
    throw new Error('Workflow not found')
  }

  // Move to next step or notify supervisor
  if (workflow.currentStep < workflow.steps.length - 1) {
    workflow.currentStep++
  }

  // Add escalation note to current step
  if (workflow.steps[workflow.currentStep]) {
    workflow.steps[workflow.currentStep].comments = 
      (workflow.steps[workflow.currentStep].comments || '') + `\n[ESCALATED: ${reason}]`
  }

  await workflow.save()
}

