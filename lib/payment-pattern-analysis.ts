import { Payment, Family, FamilyMember, RecurringPayment } from './models'
import connectDB from './database'

export interface PaymentPattern {
  averageDaysToPay: number // Average days from due date to payment
  typicalPaymentDay: number | null // Day of month they typically pay (1-31)
  typicalPaymentAmount: number | null // Typical payment amount
  paymentFrequency: 'consistent' | 'irregular' | 'declining' | 'improving'
  onTimeRate: number // Percentage of payments made on time (0-100)
  averageDaysLate: number // Average days late when late
  riskLevel: 'low' | 'medium' | 'high'
  suggestions: string[]
}

export interface PaymentSuggestion {
  suggestedAmount: number | null
  suggestedDate: Date | null
  reason: string
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Analyze payment patterns for a family
 */
export async function analyzePaymentPattern(familyId: string): Promise<PaymentPattern> {
  await connectDB()
  
  const familyRaw = await Family.findById(familyId).lean()
  const family = familyRaw as any
  if (!family) {
    throw new Error('Family not found')
  }

  // Get all payments for this family (last 2 years)
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
  
  const paymentsRaw = await Payment.find({
    familyId,
    paymentDate: { $gte: twoYearsAgo },
    isFullyRefunded: { $ne: true }
  })
    .sort({ paymentDate: 1 })
    .lean()
  const payments = paymentsRaw as any

  if (payments.length === 0) {
    return {
      averageDaysToPay: 0,
      typicalPaymentDay: null,
      typicalPaymentAmount: null,
      paymentFrequency: 'irregular',
      onTimeRate: 0,
      averageDaysLate: 0,
      riskLevel: 'medium',
      suggestions: ['No payment history available. Consider reaching out to establish payment expectations.']
    }
  }

  // Get recurring payments to calculate due dates
  const recurringPaymentsRaw = await RecurringPayment.find({
    familyId,
    isActive: true
  }).lean()
  const recurringPayments = recurringPaymentsRaw as any

  // Analyze payment timing
  const paymentDays: number[] = []
  const paymentAmounts: number[] = []
  const daysFromDue: number[] = []
  let onTimeCount = 0
  let lateCount = 0
  let totalDaysLate = 0

  for (const payment of payments) {
    const paymentDate = new Date(payment.paymentDate)
    paymentDays.push(paymentDate.getDate())
    paymentAmounts.push(payment.amount)

    // Find closest recurring payment due date
    if (recurringPayments.length > 0) {
      const closestRecurring = recurringPayments.find((rp: any) => {
        const dueDate = new Date(rp.nextPaymentDate)
        const daysDiff = Math.abs((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysDiff <= 15 // Within 15 days of due date
      })

      if (closestRecurring) {
        const dueDate = new Date(closestRecurring.nextPaymentDate)
        const daysDiff = Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        daysFromDue.push(daysDiff)
        
        if (daysDiff <= 0) {
          onTimeCount++
        } else {
          lateCount++
          totalDaysLate += daysDiff
        }
      }
    }
  }

  // Calculate statistics
  const averageDaysToPay = daysFromDue.length > 0
    ? daysFromDue.reduce((a, b) => a + b, 0) / daysFromDue.length
    : 0

  const typicalPaymentDay = paymentDays.length > 0
    ? Math.round(paymentDays.reduce((a, b) => a + b, 0) / paymentDays.length)
    : null

  const typicalPaymentAmount = paymentAmounts.length > 0
    ? paymentAmounts.reduce((a, b) => a + b, 0) / paymentAmounts.length
    : null

  const totalPayments = onTimeCount + lateCount
  const onTimeRate = totalPayments > 0 ? (onTimeCount / totalPayments) * 100 : 0
  const averageDaysLate = lateCount > 0 ? totalDaysLate / lateCount : 0

  // Determine payment frequency pattern
  let paymentFrequency: 'consistent' | 'irregular' | 'declining' | 'improving' = 'irregular'
  if (payments.length >= 6) {
    const recentPayments = payments.slice(-6)
    const olderPayments = payments.slice(0, Math.min(6, payments.length - 6))
    
    const recentAvg = recentPayments.reduce((sum: number, p: any) => sum + p.amount, 0) / recentPayments.length
    const olderAvg = olderPayments.reduce((sum: number, p: any) => sum + p.amount, 0) / olderPayments.length
    
    if (Math.abs(recentAvg - olderAvg) < olderAvg * 0.1) {
      paymentFrequency = 'consistent'
    } else if (recentAvg < olderAvg * 0.9) {
      paymentFrequency = 'declining'
    } else if (recentAvg > olderAvg * 1.1) {
      paymentFrequency = 'improving'
    }
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  if (onTimeRate < 50 || averageDaysLate > 30) {
    riskLevel = 'high'
  } else if (onTimeRate < 75 || averageDaysLate > 14) {
    riskLevel = 'medium'
  }

  // Generate suggestions
  const suggestions: string[] = []
  
  if (typicalPaymentDay && typicalPaymentDay > 0) {
    suggestions.push(`This family typically pays around the ${getDaySuffix(typicalPaymentDay)} of the month. Consider sending reminders a few days before.`)
  }
  
  if (onTimeRate < 50) {
    suggestions.push(`This family has a low on-time payment rate (${Math.round(onTimeRate)}%). Consider more frequent reminders or reaching out personally.`)
  } else if (onTimeRate >= 90) {
    suggestions.push(`This family has an excellent payment record (${Math.round(onTimeRate)}% on-time).`)
  }
  
  if (averageDaysLate > 0 && averageDaysLate < 7) {
    suggestions.push(`This family typically pays ${Math.round(averageDaysLate)} days late. Consider sending reminders earlier.`)
  }
  
  if (paymentFrequency === 'declining') {
    suggestions.push(`Payment amounts have been declining. Consider checking in with the family.`)
  } else if (paymentFrequency === 'improving') {
    suggestions.push(`Payment amounts have been improving. Great progress!`)
  }

  return {
    averageDaysToPay,
    typicalPaymentDay,
    typicalPaymentAmount,
    paymentFrequency,
    onTimeRate,
    averageDaysLate,
    riskLevel,
    suggestions
  }
}

/**
 * Get smart payment suggestions for a family
 */
export async function getPaymentSuggestions(
  familyId: string,
  currentBalance: number,
  nextPaymentDate: Date
): Promise<PaymentSuggestion> {
  await connectDB()
  
  const pattern = await analyzePaymentPattern(familyId)
  const familyRaw = await Family.findById(familyId).lean()
  const family = familyRaw as any
  if (!family) {
    throw new Error('Family not found')
  }

  // Get recurring payment amount
  const recurringPaymentRaw = await RecurringPayment.findOne({
    familyId,
    isActive: true
  }).lean()
  const recurringPayment = recurringPaymentRaw as any

  const recurringAmount = recurringPayment?.amount || 0

  // Calculate suggested amount
  let suggestedAmount: number | null = null
  let reason = ''
  let confidence: 'high' | 'medium' | 'low' = 'low'

  if (currentBalance > 0) {
    // If they have a balance, suggest paying it off
    if (currentBalance <= recurringAmount * 2) {
      suggestedAmount = currentBalance
      reason = `Based on your current balance of $${currentBalance.toFixed(2)}, we suggest paying the full amount to get caught up.`
      confidence = 'high'
    } else {
      // Suggest partial payment
      suggestedAmount = recurringAmount
      reason = `Your balance is $${currentBalance.toFixed(2)}. We suggest paying at least $${recurringAmount.toFixed(2)} to stay current.`
      confidence = 'medium'
    }
  } else if (pattern.typicalPaymentAmount) {
    // Suggest based on their typical payment
    suggestedAmount = pattern.typicalPaymentAmount
    reason = `Based on your payment history, you typically pay $${pattern.typicalPaymentAmount.toFixed(2)}.`
    confidence = pattern.paymentFrequency === 'consistent' ? 'high' : 'medium'
  } else if (recurringAmount > 0) {
    suggestedAmount = recurringAmount
    reason = `Your recurring payment amount is $${recurringAmount.toFixed(2)}.`
    confidence = 'high'
  }

  // Calculate suggested date
  let suggestedDate: Date | null = null
  
  if (pattern.typicalPaymentDay && pattern.typicalPaymentDay > 0) {
    const today = new Date()
    const suggested = new Date(today.getFullYear(), today.getMonth(), pattern.typicalPaymentDay)
    
    // If the day has passed this month, suggest next month
    if (suggested < today) {
      suggested.setMonth(suggested.getMonth() + 1)
    }
    
    suggestedDate = suggested
    reason += ` You typically pay around the ${getDaySuffix(pattern.typicalPaymentDay)} of the month.`
  } else {
    // Suggest 3 days before due date if no pattern
    suggestedDate = new Date(nextPaymentDate)
    suggestedDate.setDate(suggestedDate.getDate() - 3)
    reason += ` We suggest paying 3 days before your due date to ensure timely processing.`
  }

  return {
    suggestedAmount,
    suggestedDate,
    reason,
    confidence
  }
}

/**
 * Identify families at risk
 */
export async function identifyAtRiskFamilies(userId?: string): Promise<Array<{
  familyId: string
  familyName: string
  riskLevel: 'low' | 'medium' | 'high'
  reasons: string[]
  currentBalance: number
  daysOverdue: number
}>> {
  await connectDB()
  
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
  
  // Get all families with payments in last 2 years
  const familiesWithPayments = await Payment.distinct('familyId', {
    paymentDate: { $gte: twoYearsAgo },
    isFullyRefunded: { $ne: true }
  })

  const atRiskFamilies = []

  for (const familyId of familiesWithPayments) {
    const pattern = await analyzePaymentPattern(familyId.toString())
    
    if (pattern.riskLevel === 'high' || pattern.riskLevel === 'medium') {
      const familyRaw = await Family.findById(familyId).lean()
      const family = familyRaw as any
      if (!family) continue

      // Filter by userId if provided
      if (userId && family.userId?.toString() !== userId) continue

      // Get current balance and overdue status
      const recurringPaymentRaw = await RecurringPayment.findOne({
        familyId,
        isActive: true
      }).lean()
      const recurringPayment = recurringPaymentRaw as any

      const currentBalance = family.openBalance || 0
      const daysOverdue = recurringPayment?.daysOverdue || 0

      const reasons: string[] = []
      if (pattern.onTimeRate < 50) {
        reasons.push(`Low on-time payment rate (${Math.round(pattern.onTimeRate)}%)`)
      }
      if (pattern.averageDaysLate > 14) {
        reasons.push(`Average ${Math.round(pattern.averageDaysLate)} days late`)
      }
      if (currentBalance > 0) {
        reasons.push(`Current balance of $${currentBalance.toFixed(2)}`)
      }
      if (daysOverdue > 0) {
        reasons.push(`${daysOverdue} days overdue`)
      }
      if (pattern.paymentFrequency === 'declining') {
        reasons.push('Declining payment amounts')
      }

      atRiskFamilies.push({
        familyId: familyId.toString(),
        familyName: family.name,
        riskLevel: pattern.riskLevel,
        reasons,
        currentBalance,
        daysOverdue
      })
    }
  }

  // Sort by risk level (high first) then by balance
  atRiskFamilies.sort((a, b) => {
    if (a.riskLevel !== b.riskLevel) {
      const order = { high: 3, medium: 2, low: 1 }
      return order[b.riskLevel] - order[a.riskLevel]
    }
    return b.currentBalance - a.currentBalance
  })

  return atRiskFamilies
}

/**
 * Helper function to get day suffix (1st, 2nd, 3rd, etc.)
 */
function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return `${day}th`
  }
  switch (day % 10) {
    case 1: return `${day}st`
    case 2: return `${day}nd`
    case 3: return `${day}rd`
    default: return `${day}th`
  }
}

