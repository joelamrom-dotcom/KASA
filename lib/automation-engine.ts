// Automation Rules Engine
// Executes automation rules based on triggers and conditions

import { AutomationRule, AutomationRuleExecution, Family, FamilyMember, Payment, Task, Notification, LifecycleEventPayment } from './models'
import { sendEmail } from './email-helpers'
import { sendSMS } from './sms-helpers'

export interface TriggerData {
  type: string
  familyId?: string
  memberId?: string
  paymentId?: string
  eventId?: string
  taskId?: string
  data?: any // Additional context data
}

/**
 * Execute automation rules for a given trigger
 */
export async function executeAutomationRules(
  triggerData: TriggerData,
  userId?: string
): Promise<{ executed: number; failed: number }> {
  try {
    await import('./database').then(m => m.default())
    
    // Find all active rules that match this trigger
    const query: any = {
      isActive: true,
      'trigger.type': triggerData.type,
    }
    
    if (userId) {
      query.userId = userId
    }
    
    const rules = await AutomationRule.find(query)
    
    if (rules.length === 0) {
      return { executed: 0, failed: 0 }
    }
    
    let executed = 0
    let failed = 0
    
    // Execute each matching rule
    for (const rule of rules) {
      try {
        // Check rate limiting
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const lastReset = rule.lastResetDate || new Date(rule.createdAt)
        lastReset.setHours(0, 0, 0, 0)
        
        if (today.getTime() > lastReset.getTime()) {
          // Reset daily counter
          rule.executionsToday = 0
          rule.lastResetDate = today
        }
        
        if (rule.executionsToday >= rule.maxExecutionsPerDay) {
          console.log(`Rule ${rule.name} exceeded daily execution limit`)
          continue
        }
        
        // Check conditions
        const conditionsMatch = await checkConditions(rule.conditions || [], triggerData)
        
        if (!conditionsMatch) {
          continue // Skip this rule if conditions don't match
        }
        
        // Execute actions
        const result = await executeActions(rule.actions || [], triggerData, rule.userId)
        
        // Update rule execution tracking
        rule.executionCount += 1
        rule.executionsToday += 1
        rule.lastExecutedAt = new Date()
        rule.lastExecutionResult = {
          success: result.success,
          message: result.message,
          executedActions: result.executed,
          failedActions: result.failed,
        }
        await rule.save()
        
        // Log execution
        await AutomationRuleExecution.create({
          ruleId: rule._id,
          userId: rule.userId,
          triggerType: triggerData.type,
          triggerData,
          conditionsMatched: true,
          actionsExecuted: result.actionResults,
          executionTime: result.executionTime,
          success: result.success,
          error: result.error,
        })
        
        if (result.success) {
          executed++
        } else {
          failed++
        }
      } catch (error: any) {
        console.error(`Error executing rule ${rule.name}:`, error)
        failed++
        
        // Log failed execution
        await AutomationRuleExecution.create({
          ruleId: rule._id,
          userId: rule.userId,
          triggerType: triggerData.type,
          triggerData,
          conditionsMatched: false,
          actionsExecuted: [],
          executionTime: 0,
          success: false,
          error: error.message,
        })
      }
    }
    
    return { executed, failed }
  } catch (error: any) {
    console.error('Error in executeAutomationRules:', error)
    return { executed: 0, failed: 0 }
  }
}

/**
 * Check if conditions match the trigger data
 */
async function checkConditions(
  conditions: any[],
  triggerData: TriggerData
): Promise<boolean> {
  if (conditions.length === 0) {
    return true // No conditions = always match
  }
  
  // Load related data if needed
  let family: any = null
  let member: any = null
  let payment: any = null
  
  if (triggerData.familyId) {
    family = await Family.findById(triggerData.familyId).lean()
  }
  
  if (triggerData.memberId) {
    member = await FamilyMember.findById(triggerData.memberId).lean()
    if (member && !family && member.familyId) {
      family = await Family.findById(member.familyId).lean()
    }
  }
  
  if (triggerData.paymentId) {
    payment = await Payment.findById(triggerData.paymentId).lean()
    if (payment && !family && payment.familyId) {
      family = await Family.findById(payment.familyId).lean()
    }
  }
  
  // Evaluate conditions
  let result = true
  let lastLogicalOp = 'AND'
  
  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i]
    const conditionResult = evaluateCondition(condition, { family, member, payment, triggerData })
    
    if (i === 0) {
      result = conditionResult
    } else {
      if (lastLogicalOp === 'AND') {
        result = result && conditionResult
      } else {
        result = result || conditionResult
      }
    }
    
    lastLogicalOp = condition.logicalOperator || 'AND'
  }
  
  return result
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(condition: any, context: any): boolean {
  const { field, operator, value } = condition
  const { family, member, payment, triggerData } = context
  
  // Get field value
  let fieldValue: any = null
  
  if (field.startsWith('family.')) {
    const fieldName = field.replace('family.', '')
    fieldValue = family?.[fieldName]
  } else if (field.startsWith('member.')) {
    const fieldName = field.replace('member.', '')
    fieldValue = member?.[fieldName]
  } else if (field.startsWith('payment.')) {
    const fieldName = field.replace('payment.', '')
    fieldValue = payment?.[fieldName]
  } else if (field.startsWith('trigger.')) {
    const fieldName = field.replace('trigger.', '')
    fieldValue = triggerData.data?.[fieldName] || triggerData[fieldName]
  } else {
    fieldValue = triggerData.data?.[field]
  }
  
  // Evaluate operator
  switch (operator) {
    case 'equals':
      return fieldValue == value
    case 'not_equals':
      return fieldValue != value
    case 'greater_than':
      return Number(fieldValue) > Number(value)
    case 'less_than':
      return Number(fieldValue) < Number(value)
    case 'greater_or_equal':
      return Number(fieldValue) >= Number(value)
    case 'less_or_equal':
      return Number(fieldValue) <= Number(value)
    case 'contains':
      return String(fieldValue || '').toLowerCase().includes(String(value || '').toLowerCase())
    case 'not_contains':
      return !String(fieldValue || '').toLowerCase().includes(String(value || '').toLowerCase())
    case 'is_empty':
      return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0)
    case 'is_not_empty':
      return fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0)
    default:
      return false
  }
}

/**
 * Execute actions for a rule
 */
async function executeActions(
  actions: any[],
  triggerData: TriggerData,
  userId: string
): Promise<{
  success: boolean
  message: string
  executed: number
  failed: number
  actionResults: any[]
  executionTime: number
  error?: string
}> {
  const startTime = Date.now()
  const actionResults: any[] = []
  let executed = 0
  let failed = 0
  
  // Sort actions by order
  const sortedActions = [...actions].sort((a, b) => (a.order || 0) - (b.order || 0))
  
  for (const action of sortedActions) {
    const actionStart = Date.now()
    try {
      const result = await executeAction(action, triggerData, userId)
      actionResults.push({
        actionType: action.type,
        actionConfig: action.config,
        success: true,
        result,
        executedAt: new Date(),
      })
      executed++
    } catch (error: any) {
      actionResults.push({
        actionType: action.type,
        actionConfig: action.config,
        success: false,
        error: error.message,
        executedAt: new Date(),
      })
      failed++
    }
  }
  
  const executionTime = Date.now() - startTime
  
  return {
    success: failed === 0,
    message: `Executed ${executed} actions, ${failed} failed`,
    executed,
    failed,
    actionResults,
    executionTime,
  }
}

/**
 * Execute a single action
 */
async function executeAction(
  action: any,
  triggerData: TriggerData,
  userId: string
): Promise<any> {
  const { type, config } = action
  
  // Load related data
  let family: any = null
  let member: any = null
  
  if (triggerData.familyId) {
    family = await Family.findById(triggerData.familyId)
  }
  
  if (triggerData.memberId) {
    member = await FamilyMember.findById(triggerData.memberId)
    if (member && !family && member.familyId) {
      family = await Family.findById(member.familyId)
    }
  }
  
  switch (type) {
    case 'send_email':
      return await executeSendEmail(config, family, member, triggerData, userId)
    
    case 'send_sms':
      return await executeSendSMS(config, family, member, triggerData, userId)
    
    case 'create_task':
      return await executeCreateTask(config, family, member, triggerData, userId)
    
    case 'create_notification':
      return await executeCreateNotification(config, family, member, triggerData, userId)
    
    case 'update_payment_plan':
      return await executeUpdatePaymentPlan(config, family, member, triggerData, userId)
    
    case 'create_lifecycle_event':
      return await executeCreateLifecycleEvent(config, family, member, triggerData, userId)
    
    case 'update_family':
      return await executeUpdateFamily(config, family, triggerData, userId)
    
    case 'update_member':
      return await executeUpdateMember(config, member, triggerData, userId)
    
    case 'generate_statement':
      return await executeGenerateStatement(config, family, triggerData, userId)
    
    case 'create_audit_log':
      return await executeCreateAuditLog(config, family, member, triggerData, userId)
    
    case 'webhook':
      return await executeWebhook(config, family, member, triggerData, userId)
    
    case 'send_push_notification':
      return await executeSendPushNotification(config, family, member, triggerData, userId)
    
    case 'update_task':
      return await executeUpdateTask(config, family, member, triggerData, userId)
    
    case 'update_recurring_payment':
      return await executeUpdateRecurringPayment(config, family, member, triggerData, userId)
    
    case 'update_lifecycle_event':
      return await executeUpdateLifecycleEvent(config, family, member, triggerData, userId)
    
    case 'create_withdrawal':
      return await executeCreateWithdrawal(config, family, member, triggerData, userId)
    
    case 'add_family_note':
      return await executeAddFamilyNote(config, family, member, triggerData, userId)
    
    case 'add_family_tag':
      return await executeAddFamilyTag(config, family, member, triggerData, userId)
    
    case 'remove_family_tag':
      return await executeRemoveFamilyTag(config, family, member, triggerData, userId)
    
    case 'send_statement':
      return await executeSendStatement(config, family, member, triggerData, userId)
    
    case 'generate_invoice':
      return await executeGenerateInvoice(config, family, member, triggerData, userId)
    
    case 'send_invoice':
      return await executeSendInvoice(config, family, member, triggerData, userId)
    
    case 'create_payment_link':
      return await executeCreatePaymentLink(config, family, member, triggerData, userId)
    
    case 'create_document':
      return await executeCreateDocument(config, family, member, triggerData, userId)
    
    case 'update_family_balance':
      return await executeUpdateFamilyBalance(config, family, member, triggerData, userId)
    
    case 'archive_family':
      return await executeArchiveFamily(config, family, member, triggerData, userId)
    
    case 'restore_family':
      return await executeRestoreFamily(config, family, member, triggerData, userId)
    
    case 'export_data':
      return await executeExportData(config, family, member, triggerData, userId)
    
    default:
      throw new Error(`Unknown action type: ${type}`)
  }
}

// Action executors
async function executeSendEmail(config: any, family: any, member: any, triggerData: any, userId: string) {
  const to = resolveRecipient(config.to, family, member)
  const subject = resolveTemplate(config.subject, family, member, triggerData)
  const body = resolveTemplate(config.body, family, member, triggerData)
  
  await sendEmail(to, subject, body, userId)
  return { sent: true, to, subject }
}

async function executeSendSMS(config: any, family: any, member: any, triggerData: any, userId: string) {
  const phoneNumber = resolveRecipient(config.phoneNumber || config.to, family, member)
  const message = resolveTemplate(config.message || config.body, family, member, triggerData)
  
  await sendSMS(phoneNumber, message, userId)
  return { sent: true, phoneNumber, message }
}

async function executeCreateTask(config: any, family: any, member: any, triggerData: any, userId: string) {
  const title = resolveTemplate(config.taskTitle, family, member, triggerData)
  const description = resolveTemplate(config.taskDescription || '', family, member, triggerData)
  const dueDate = resolveDate(config.taskDueDate, triggerData)
  const assigneeEmail = resolveRecipient(config.taskAssignee, family, member)
  
  // Find user by email if assignee is email
  let assigneeUserId = userId
  if (assigneeEmail && assigneeEmail !== 'admin' && assigneeEmail !== 'family') {
    const { User } = await import('./models')
    const assigneeUser = await User.findOne({ email: assigneeEmail })
    if (assigneeUser) {
      assigneeUserId = assigneeUser._id.toString()
    }
  }
  
  const task = await Task.create({
    title,
    description,
    dueDate,
    email: assigneeEmail === 'family' ? family?.email : assigneeEmail,
    status: 'pending',
    priority: config.taskPriority || 'medium',
    relatedFamilyId: family?._id,
    relatedMemberId: member?._id,
  })
  
  return { created: true, taskId: task._id }
}

async function executeCreateNotification(config: any, family: any, member: any, triggerData: any, userId: string) {
  const message = resolveTemplate(config.notificationMessage, family, member, triggerData)
  
  const notification = await Notification.create({
    userId,
    message,
    type: config.notificationType || 'info',
  })
  
  return { created: true, notificationId: notification._id }
}

async function executeUpdatePaymentPlan(config: any, family: any, member: any, triggerData: any, userId: string) {
  if (!family && !member) {
    throw new Error('No family or member to update payment plan for')
  }
  
  const target = member || family
  const updateData: any = {}
  
  if (config.paymentPlanId) {
    updateData.paymentPlanId = config.paymentPlanId
  }
  if (config.paymentPlanNumber) {
    updateData.paymentPlan = config.paymentPlanNumber
    updateData.currentPlan = config.paymentPlanNumber
  }
  
  if (member) {
    await FamilyMember.findByIdAndUpdate(member._id, updateData)
  } else {
    await Family.findByIdAndUpdate(family._id, updateData)
  }
  
  return { updated: true }
}

async function executeCreateLifecycleEvent(config: any, family: any, member: any, triggerData: any, userId: string) {
  if (!family) {
    throw new Error('No family to create lifecycle event for')
  }
  
  const eventDate = resolveDate(config.eventDate, triggerData)
  const eventYear = eventDate.getFullYear()
  
  const event = await LifecycleEventPayment.create({
    familyId: family._id,
    memberId: member?._id,
    eventType: config.eventType,
    amount: config.eventAmount || 0,
    eventDate,
    year: eventYear,
    notes: `Auto-created by automation rule`,
  })
  
  return { created: true, eventId: event._id }
}

async function executeUpdateFamily(config: any, family: any, triggerData: any, userId: string) {
  if (!family) {
    throw new Error('No family to update')
  }
  
  const updates = resolveTemplateObject(config.updates || {}, family, null, triggerData)
  await Family.findByIdAndUpdate(family._id, updates)
  
  return { updated: true }
}

async function executeUpdateMember(config: any, member: any, triggerData: any, userId: string) {
  if (!member) {
    throw new Error('No member to update')
  }
  
  const updates = resolveTemplateObject(config.updates || {}, null, member, triggerData)
  await FamilyMember.findByIdAndUpdate(member._id, updates)
  
  return { updated: true }
}

async function executeGenerateStatement(config: any, family: any, triggerData: any, userId: string) {
  if (!family) {
    throw new Error('No family to generate statement for')
  }
  
  // Generate statement using the same logic as the API route
  const { Statement, Payment, Withdrawal, LifecycleEventPayment } = await import('./models')
  const { calculateFamilyBalance } = await import('./calculations')
  
  const fromDate = config.fromDate ? new Date(config.fromDate) : new Date(new Date().getFullYear(), 0, 1) // Start of year
  const toDate = config.toDate ? new Date(config.toDate) : new Date() // Today
  
  // Get opening balance
  const openingBalanceData = await calculateFamilyBalance(family._id.toString(), new Date(fromDate.getTime() - 1))
  const openingBalance = openingBalanceData.balance
  
  // Get payments in date range
  const payments = await Payment.find({
    familyId: family._id,
    paymentDate: { $gte: fromDate, $lte: toDate }
  })
  const totalIncome = payments.reduce((sum: number, p: any) => sum + p.amount, 0)
  
  // Get withdrawals in date range
  const withdrawals = await Withdrawal.find({
    familyId: family._id,
    withdrawalDate: { $gte: fromDate, $lte: toDate }
  })
  const totalWithdrawals = withdrawals.reduce((sum: number, w: any) => sum + w.amount, 0)
  
  // Get lifecycle events in date range
  const lifecycleEvents = await LifecycleEventPayment.find({
    familyId: family._id,
    eventDate: { $gte: fromDate, $lte: toDate }
  })
  const totalExpenses = lifecycleEvents.reduce((sum: number, e: any) => sum + e.amount, 0)
  
  // Calculate closing balance
  const closingBalance = openingBalance + totalIncome - totalWithdrawals
  
  // Generate statement number
  const statementCount = await Statement.countDocuments({ familyId: family._id })
  const statementNumber = `STMT-${family._id.toString().slice(-6)}-${statementCount + 1}`
  
  const statement = await Statement.create({
    familyId: family._id,
    statementNumber,
    date: new Date(),
    fromDate,
    toDate,
    openingBalance,
    income: totalIncome,
    withdrawals: totalWithdrawals,
    expenses: totalExpenses,
    closingBalance
  })
  
  return { generated: true, statementId: statement._id, statementNumber }
}

async function executeCreateAuditLog(config: any, family: any, member: any, triggerData: any, userId: string) {
  const { createAuditLog } = await import('./audit-log')
  
  await createAuditLog({
    userId,
    action: config.action || 'automation_triggered',
    entityType: config.entityType || 'automation',
    entityId: family?._id || member?._id,
    description: resolveTemplate(config.description || 'Automation rule executed', family, member, triggerData),
    metadata: triggerData,
  })
  
  return { logged: true }
}

async function executeWebhook(config: any, family: any, member: any, triggerData: any, userId: string) {
  const url = config.webhookUrl
  const method = config.webhookMethod || 'POST'
  const headers = config.webhookHeaders || { 'Content-Type': 'application/json' }
  const body = resolveTemplateObject(config.webhookBody || {}, family, member, triggerData)
  
  const response = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(body),
  })
  
  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
  }
  
  return { sent: true, status: response.status }
}

// New action executors
async function executeSendPushNotification(config: any, family: any, member: any, triggerData: any, userId: string) {
  // Use Notification model for push notifications
  const { Notification } = await import('./models')
  const title = resolveTemplate(config.title || config.notificationTitle || 'Notification', family, member, triggerData)
  const message = resolveTemplate(config.message || config.notificationMessage, family, member, triggerData)
  const targetUserId = config.userId || userId
  
  // Create notification (which can trigger push if user has push enabled)
  await Notification.create({
    userId: targetUserId,
    message: `${title}: ${message}`,
    type: config.notificationType || 'info',
    url: config.url,
  })
  
  return { sent: true, targetUserId, title, message }
}

async function executeUpdateTask(config: any, family: any, member: any, triggerData: any, userId: string) {
  const { Task } = await import('./models')
  const taskId = config.taskId || triggerData.taskId
  
  if (!taskId) {
    throw new Error('Task ID is required to update task')
  }
  
  const updates: any = {}
  if (config.status) updates.status = config.status
  if (config.priority) updates.priority = config.priority
  if (config.title) updates.title = resolveTemplate(config.title, family, member, triggerData)
  if (config.description) updates.description = resolveTemplate(config.description, family, member, triggerData)
  if (config.dueDate) updates.dueDate = resolveDate(config.dueDate, triggerData)
  
  await Task.findByIdAndUpdate(taskId, updates)
  return { updated: true, taskId }
}

async function executeUpdateRecurringPayment(config: any, family: any, member: any, triggerData: any, userId: string) {
  const { RecurringPayment } = await import('./models')
  const recurringPaymentId = config.recurringPaymentId || triggerData.recurringPaymentId
  
  if (!recurringPaymentId) {
    throw new Error('Recurring Payment ID is required')
  }
  
  const updates: any = {}
  if (config.amount !== undefined) updates.amount = config.amount
  if (config.frequency) updates.frequency = config.frequency
  if (config.nextPaymentDate) updates.nextPaymentDate = resolveDate(config.nextPaymentDate, triggerData)
  if (config.isActive !== undefined) updates.isActive = config.isActive
  
  await RecurringPayment.findByIdAndUpdate(recurringPaymentId, updates)
  return { updated: true, recurringPaymentId }
}

async function executeUpdateLifecycleEvent(config: any, family: any, member: any, triggerData: any, userId: string) {
  const { LifecycleEventPayment } = await import('./models')
  const eventId = config.eventId || triggerData.eventId
  
  if (!eventId) {
    throw new Error('Event ID is required to update lifecycle event')
  }
  
  const updates: any = {}
  if (config.amount !== undefined) updates.amount = config.amount
  if (config.eventDate) updates.eventDate = resolveDate(config.eventDate, triggerData)
  if (config.notes) updates.notes = resolveTemplate(config.notes, family, member, triggerData)
  
  await LifecycleEventPayment.findByIdAndUpdate(eventId, updates)
  return { updated: true, eventId }
}

async function executeCreateWithdrawal(config: any, family: any, member: any, triggerData: any, userId: string) {
  const { Withdrawal } = await import('./models')
  
  if (!family) {
    throw new Error('No family to create withdrawal for')
  }
  
  const withdrawal = await Withdrawal.create({
    familyId: family._id,
    amount: config.amount || 0,
    withdrawalDate: resolveDate(config.withdrawalDate, triggerData),
    reason: resolveTemplate(config.reason || 'Automated withdrawal', family, member, triggerData),
    notes: resolveTemplate(config.notes || '', family, member, triggerData),
  })
  
  return { created: true, withdrawalId: withdrawal._id }
}

async function executeAddFamilyNote(config: any, family: any, member: any, triggerData: any, userId: string) {
  const { FamilyNote } = await import('./models')
  
  if (!family) {
    throw new Error('No family to add note to')
  }
  
  const note = await FamilyNote.create({
    familyId: family._id,
    userId,
    note: resolveTemplate(config.note || config.message, family, member, triggerData),
    category: config.category || 'automation',
  })
  
  return { created: true, noteId: note._id }
}

async function executeAddFamilyTag(config: any, family: any, member: any, triggerData: any, userId: string) {
  const { Family, FamilyTag } = await import('./models')
  
  if (!family) {
    throw new Error('No family to add tag to')
  }
  
  const tagName = resolveTemplate(config.tagName || config.tag, family, member, triggerData)
  
  // Find or create tag
  let tag = await FamilyTag.findOne({ name: tagName, userId })
  if (!tag) {
    tag = await FamilyTag.create({
      name: tagName,
      userId,
      color: config.color || '#3b82f6',
    })
  }
  
  // Add tag to family if not already present
  if (!family.tags || !family.tags.includes(tag._id)) {
    await Family.findByIdAndUpdate(family._id, {
      $addToSet: { tags: tag._id },
    })
  }
  
  return { added: true, tagId: tag._id, tagName }
}

async function executeRemoveFamilyTag(config: any, family: any, member: any, triggerData: any, userId: string) {
  const { Family, FamilyTag } = await import('./models')
  
  if (!family) {
    throw new Error('No family to remove tag from')
  }
  
  const tagName = resolveTemplate(config.tagName || config.tag, family, member, triggerData)
  const tag = await FamilyTag.findOne({ name: tagName, userId })
  
  if (tag && family.tags && family.tags.includes(tag._id)) {
    await Family.findByIdAndUpdate(family._id, {
      $pull: { tags: tag._id },
    })
  }
  
  return { removed: true, tagName }
}

async function executeSendStatement(config: any, family: any, member: any, triggerData: any, userId: string) {
  const { Statement } = await import('./models')
  const statementId = config.statementId || triggerData.statementId
  
  if (!statementId) {
    throw new Error('Statement ID is required to send statement')
  }
  
  const statement = await Statement.findById(statementId)
  if (!statement || !family) {
    throw new Error('Statement or family not found')
  }
  
  // Send statement via email
  const { sendEmail } = await import('./email-utils')
  const subject = resolveTemplate(config.subject || 'Your Statement', family, member, triggerData)
  const body = resolveTemplate(config.body || 'Please find your statement attached.', family, member, triggerData)
  
  await sendEmail(family.email, subject, body, userId)
  
  return { sent: true, statementId, to: family.email }
}

async function executeGenerateInvoice(config: any, family: any, member: any, triggerData: any, userId: string) {
  // Similar to statement generation but for invoices
  // This would use invoice generation logic
  return { generated: true, message: 'Invoice generation coming soon' }
}

async function executeSendInvoice(config: any, family: any, member: any, triggerData: any, userId: string) {
  // Send invoice via email
  const { sendEmail } = await import('./email-utils')
  const invoiceId = config.invoiceId || triggerData.invoiceId
  
  if (!family) {
    throw new Error('No family to send invoice to')
  }
  
  const subject = resolveTemplate(config.subject || 'Your Invoice', family, member, triggerData)
  const body = resolveTemplate(config.body || 'Please find your invoice attached.', family, member, triggerData)
  
  await sendEmail(family.email, subject, body, userId)
  
  return { sent: true, invoiceId, to: family.email }
}

async function executeCreatePaymentLink(config: any, family: any, member: any, triggerData: any, userId: string) {
  const { PaymentLink } = await import('./models')
  
  if (!family) {
    throw new Error('No family to create payment link for')
  }
  
  const link = await PaymentLink.create({
    userId,
    familyId: family._id,
    amount: config.amount || 0,
    description: resolveTemplate(config.description || 'Payment Request', family, member, triggerData),
    expiresAt: config.expiresAt ? resolveDate(config.expiresAt, triggerData) : undefined,
    maxUses: config.maxUses || 1,
  })
  
  return { created: true, linkId: link._id, linkUrl: `/pay/${link._id}` }
}

async function executeCreateDocument(config: any, family: any, member: any, triggerData: any, userId: string) {
  // Document creation would use document management system
  return { created: true, message: 'Document creation coming soon' }
}

async function executeUpdateFamilyBalance(config: any, family: any, member: any, triggerData: any, userId: string) {
  const { Family } = await import('./models')
  const { calculateFamilyBalance } = await import('./calculations')
  
  if (!family) {
    throw new Error('No family to update balance for')
  }
  
  // Recalculate and update balance
  const balanceData = await calculateFamilyBalance(family._id.toString())
  await Family.findByIdAndUpdate(family._id, {
    currentPayment: balanceData.balance,
  })
  
  return { updated: true, balance: balanceData.balance }
}

async function executeArchiveFamily(config: any, family: any, member: any, triggerData: any, userId: string) {
  const { Family } = await import('./models')
  
  if (!family) {
    throw new Error('No family to archive')
  }
  
  await Family.findByIdAndUpdate(family._id, {
    isArchived: true,
    archivedAt: new Date(),
  })
  
  return { archived: true, familyId: family._id }
}

async function executeRestoreFamily(config: any, family: any, member: any, triggerData: any, userId: string) {
  const { Family } = await import('./models')
  
  if (!family) {
    throw new Error('No family to restore')
  }
  
  await Family.findByIdAndUpdate(family._id, {
    isArchived: false,
    $unset: { archivedAt: 1 },
  })
  
  return { restored: true, familyId: family._id }
}

async function executeExportData(config: any, family: any, member: any, triggerData: any, userId: string) {
  // Data export functionality
  return { exported: true, message: 'Data export coming soon' }
}

// Helper functions
function resolveRecipient(recipient: string, family: any, member: any): string {
  if (recipient === 'family' && family) {
    return family.email || family.husbandCellPhone || family.wifeCellPhone || ''
  }
  if (recipient === 'admin') {
    // Return admin email - would need to fetch from user
    return ''
  }
  return recipient
}

function resolveTemplate(template: string, family: any, member: any, triggerData: any): string {
  if (!template) return ''
  
  let result = template
  result = result.replace(/\{\{family\.name\}\}/g, family?.name || '')
  result = result.replace(/\{\{family\.email\}\}/g, family?.email || '')
  result = result.replace(/\{\{member\.firstName\}\}/g, member?.firstName || '')
  result = result.replace(/\{\{member\.lastName\}\}/g, member?.lastName || '')
  result = result.replace(/\{\{payment\.amount\}\}/g, triggerData.data?.amount || '')
  result = result.replace(/\{\{trigger\.type\}\}/g, triggerData.type || '')
  
  return result
}

function resolveTemplateObject(obj: any, family: any, member: any, triggerData: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return resolveTemplate(String(obj || ''), family, member, triggerData)
  }
  
  const result: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      result[key] = resolveTemplateObject(value, family, member, triggerData)
    } else {
      result[key] = resolveTemplate(String(value || ''), family, member, triggerData)
    }
  }
  return result
}

function resolveDate(dateStr: string, triggerData: any): Date {
  if (!dateStr) {
    return new Date()
  }
  
  // Handle relative dates like "+7 days", "+1 month"
  if (dateStr.startsWith('+')) {
    const match = dateStr.match(/^\+(\d+)\s*(day|days|month|months|year|years)$/i)
    if (match) {
      const amount = parseInt(match[1])
      const unit = match[2].toLowerCase()
      const date = new Date()
      
      if (unit.startsWith('day')) {
        date.setDate(date.getDate() + amount)
      } else if (unit.startsWith('month')) {
        date.setMonth(date.getMonth() + amount)
      } else if (unit.startsWith('year')) {
        date.setFullYear(date.getFullYear() + amount)
      }
      
      return date
    }
  }
  
  // Handle absolute dates
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) {
    return parsed
  }
  
  return new Date()
}

