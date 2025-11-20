import { RecurringPayment, Family } from './models'

/**
 * Calculate days overdue for a recurring payment
 */
export function calculateDaysOverdue(nextPaymentDate: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const dueDate = new Date(nextPaymentDate)
  dueDate.setHours(0, 0, 0, 0)
  
  const diffTime = today.getTime() - dueDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays > 0 ? diffDays : 0
}

/**
 * Check if a payment is overdue
 */
export function isPaymentOverdue(nextPaymentDate: Date): boolean {
  return calculateDaysOverdue(nextPaymentDate) > 0
}

/**
 * Get overdue severity level
 * Returns: 0 = not overdue, 1 = 7 days, 2 = 14 days, 3 = 30+ days
 */
export function getOverdueLevel(daysOverdue: number): number {
  if (daysOverdue === 0) return 0
  if (daysOverdue >= 30) return 3
  if (daysOverdue >= 14) return 2
  if (daysOverdue >= 7) return 1
  return 0 // Less than 7 days overdue
}

/**
 * Get overdue severity color
 */
export function getOverdueColor(daysOverdue: number): string {
  if (daysOverdue === 0) return 'gray'
  if (daysOverdue >= 30) return 'red'
  if (daysOverdue >= 14) return 'orange'
  if (daysOverdue >= 7) return 'yellow'
  return 'gray'
}

/**
 * Get overdue badge text
 */
export function getOverdueBadgeText(daysOverdue: number): string {
  if (daysOverdue === 0) return ''
  if (daysOverdue === 1) return '1 day overdue'
  if (daysOverdue < 7) return `${daysOverdue} days overdue`
  if (daysOverdue < 14) return `${daysOverdue} days overdue`
  if (daysOverdue < 30) return `${daysOverdue} days overdue`
  return `${daysOverdue}+ days overdue`
}

/**
 * Update overdue status for all recurring payments
 */
export async function updateOverdueStatus(userId?: string): Promise<{
  updated: number
  overdue: number
}> {
  const mongoose = require('mongoose')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Build query - filter by userId if provided
  const query: any = {
    isActive: true,
    nextPaymentDate: { $lt: today }
  }
  
  // If userId provided, filter by families owned by that user
  if (userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId)
    const families = await Family.find({ userId: userObjectId }).select('_id')
    const familyIds = families.map(f => f._id)
    query.familyId = { $in: familyIds }
  }
  
  const overduePayments = await RecurringPayment.find(query)
  
  let updated = 0
  let overdueCount = 0
  
  for (const payment of overduePayments) {
    const daysOverdue = calculateDaysOverdue(payment.nextPaymentDate)
    const isOverdue = daysOverdue > 0
    
    if (payment.isOverdue !== isOverdue || payment.daysOverdue !== daysOverdue) {
      payment.isOverdue = isOverdue
      payment.daysOverdue = daysOverdue
      await payment.save()
      updated++
    }
    
    if (isOverdue) {
      overdueCount++
    }
  }
  
  // Also update payments that are no longer overdue
  const notOverdueQuery: any = {
    isActive: true,
    isOverdue: true,
    nextPaymentDate: { $gte: today }
  }
  
  if (userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId)
    const families = await Family.find({ userId: userObjectId }).select('_id')
    const familyIds = families.map(f => f._id)
    notOverdueQuery.familyId = { $in: familyIds }
  }
  
  const noLongerOverdue = await RecurringPayment.find(notOverdueQuery)
  for (const payment of noLongerOverdue) {
    payment.isOverdue = false
    payment.daysOverdue = 0
    payment.reminderLevel = 0
    await payment.save()
    updated++
  }
  
  return { updated, overdue: overdueCount }
}

/**
 * Get overdue payments for a user
 */
export async function getOverduePayments(userId?: string, limit?: number) {
  const mongoose = require('mongoose')
  
  const query: any = {
    isActive: true,
    isOverdue: true
  }
  
  // If userId provided, filter by families owned by that user
  if (userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId)
    const families = await Family.find({ userId: userObjectId }).select('_id')
    const familyIds = families.map(f => f._id)
    query.familyId = { $in: familyIds }
  }
  
  const overduePayments = await RecurringPayment.find(query)
    .populate('familyId', 'name email husbandCellPhone wifeCellPhone phone')
    .populate('savedPaymentMethodId', 'last4 cardType')
    .sort({ daysOverdue: -1, nextPaymentDate: 1 })
    .limit(limit || 100)
    .lean()
  
  return overduePayments
}

