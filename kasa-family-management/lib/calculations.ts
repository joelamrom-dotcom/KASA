import { Family, FamilyMember, Payment, Withdrawal, LifecycleEventPayment, YearlyCalculation, PaymentPlan } from './models'
import connectDB from './database'

// Payment plan amounts (matching Excel)
const PAYMENT_PLANS = {
  1: { ageStart: 0, ageEnd: 4, amount: 1200 },
  2: { ageStart: 5, ageEnd: 8, amount: 1500 },
  3: { ageStart: 9, ageEnd: 16, amount: 1800 },
  4: { ageStart: 17, ageEnd: null, amount: 2500 }
}

// Lifecycle event amounts (matching Excel)
const LIFECYCLE_EVENTS = {
  chasena: 12180,
  bar_mitzvah: 1800,
  birth_boy: 500,
  birth_girl: 500
}

/**
 * Calculate age group for a member based on their age
 */
export function getAgeGroup(age: number): 1 | 2 | 3 | 4 {
  if (age >= 0 && age <= 4) return 1
  if (age >= 5 && age <= 8) return 2
  if (age >= 9 && age <= 16) return 3
  return 4 // 17+
}

/**
 * Calculate age of a member on a specific date
 */
export function calculateAge(birthDate: Date, referenceDate: Date = new Date()): number {
  const birth = new Date(birthDate)
  const ref = new Date(referenceDate)
  let age = ref.getFullYear() - birth.getFullYear()
  const monthDiff = ref.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * Calculate age on a specific year (December 31st of that year)
 */
export function calculateAgeInYear(birthDate: Date, year: number): number {
  const yearEnd = new Date(year, 11, 31) // December 31st
  return calculateAge(birthDate, yearEnd)
}

/**
 * Count members in each age group for a given year
 */
export async function countMembersByAgeGroup(year: number) {
  await connectDB()
  
  const families = await Family.find({})
  const allMembers: FamilyMember[] = []
  
  for (const family of families) {
    const members = await FamilyMember.find({ familyId: family._id })
    allMembers.push(...members)
  }
  
  const counts = {
    ageGroup0to4: 0,
    ageGroup5to8: 0,
    ageGroup9to16: 0,
    ageGroup17plus: 0
  }
  
  for (const member of allMembers) {
    const age = calculateAgeInYear(member.birthDate, year)
    const group = getAgeGroup(age)
    
    switch (group) {
      case 1:
        counts.ageGroup0to4++
        break
      case 2:
        counts.ageGroup5to8++
        break
      case 3:
        counts.ageGroup9to16++
        break
      case 4:
        counts.ageGroup17plus++
        break
    }
  }
  
  return counts
}

/**
 * Calculate income for each age group
 */
export function calculateIncomeByAgeGroup(counts: {
  ageGroup0to4: number
  ageGroup5to8: number
  ageGroup9to16: number
  ageGroup17plus: number
}) {
  return {
    incomeAgeGroup0to4: counts.ageGroup0to4 * PAYMENT_PLANS[1].amount,
    incomeAgeGroup5to8: counts.ageGroup5to8 * PAYMENT_PLANS[2].amount,
    incomeAgeGroup9to16: counts.ageGroup9to16 * PAYMENT_PLANS[3].amount,
    incomeAgeGroup17plus: counts.ageGroup17plus * PAYMENT_PLANS[4].amount
  }
}

/**
 * Calculate total income for a year
 */
export async function calculateYearlyIncome(year: number, extraDonation: number = 0) {
  const counts = await countMembersByAgeGroup(year)
  const incomeByGroup = calculateIncomeByAgeGroup(counts)
  
  const totalIncome = 
    incomeByGroup.incomeAgeGroup0to4 +
    incomeByGroup.incomeAgeGroup5to8 +
    incomeByGroup.incomeAgeGroup9to16 +
    incomeByGroup.incomeAgeGroup17plus
  
  const calculatedIncome = totalIncome + extraDonation
  
  return {
    ...counts,
    ...incomeByGroup,
    totalIncome,
    extraDonation,
    calculatedIncome
  }
}

/**
 * Count lifecycle events for a year
 */
export async function countLifecycleEvents(year: number) {
  await connectDB()
  
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31, 23, 59, 59)
  
  const events = await LifecycleEventPayment.find({
    eventDate: { $gte: startDate, $lte: endDate }
  })
  
  const counts = {
    chasenaCount: 0,
    barMitzvahCount: 0,
    birthBoyCount: 0,
    birthGirlCount: 0
  }
  
  const amounts = {
    chasenaAmount: 0,
    barMitzvahAmount: 0,
    birthBoyAmount: 0,
    birthGirlAmount: 0
  }
  
  for (const event of events) {
    switch (event.eventType) {
      case 'chasena':
        counts.chasenaCount++
        amounts.chasenaAmount += event.amount
        break
      case 'bar_mitzvah':
        counts.barMitzvahCount++
        amounts.barMitzvahAmount += event.amount
        break
      case 'birth_boy':
        counts.birthBoyCount++
        amounts.birthBoyAmount += event.amount
        break
      case 'birth_girl':
        counts.birthGirlCount++
        amounts.birthGirlAmount += event.amount
        break
    }
  }
  
  return { ...counts, ...amounts }
}

/**
 * Calculate yearly expenses
 */
export async function calculateYearlyExpenses(year: number, extraExpense: number = 0) {
  const eventData = await countLifecycleEvents(year)
  
  const totalExpenses = 
    eventData.chasenaAmount +
    eventData.barMitzvahAmount +
    eventData.birthBoyAmount +
    eventData.birthGirlAmount
  
  const calculatedExpenses = totalExpenses + extraExpense
  
  return {
    ...eventData,
    totalExpenses,
    extraExpense,
    calculatedExpenses
  }
}

/**
 * Calculate yearly balance (Income - Expenses)
 */
export async function calculateYearlyBalance(year: number, extraDonation: number = 0, extraExpense: number = 0) {
  const incomeData = await calculateYearlyIncome(year, extraDonation)
  const expenseData = await calculateYearlyExpenses(year, extraExpense)
  
  const balance = incomeData.calculatedIncome - expenseData.calculatedExpenses
  
  return {
    ...incomeData,
    ...expenseData,
    balance
  }
}

/**
 * Calculate and save yearly calculation to database
 */
export async function calculateAndSaveYear(year: number, extraDonation: number = 0, extraExpense: number = 0) {
  await connectDB()
  
  const calculationData = await calculateYearlyBalance(year, extraDonation, extraExpense)
  
  const calculation = await YearlyCalculation.findOneAndUpdate(
    { year },
    {
      ...calculationData,
      year
    },
    { upsert: true, new: true }
  )
  
  return calculation
}

/**
 * Calculate balance for a specific family
 */
export async function calculateFamilyBalance(familyId: string, asOfDate: Date = new Date()) {
  await connectDB()
  
  const family = await Family.findById(familyId)
  if (!family) throw new Error('Family not found')
  
  // Get all payments up to date
  const payments = await Payment.find({
    familyId,
    paymentDate: { $lte: asOfDate }
  })
  
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0)
  
  // Get all withdrawals up to date
  const withdrawals = await Withdrawal.find({
    familyId,
    withdrawalDate: { $lte: asOfDate }
  })
  
  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0)
  
  // Get all lifecycle event payments up to date
  const lifecyclePayments = await LifecycleEventPayment.find({
    familyId,
    eventDate: { $lte: asOfDate }
  })
  
  const totalLifecyclePayments = lifecyclePayments.reduce((sum, p) => sum + p.amount, 0)
  
  // Calculate balance: opening balance + payments - withdrawals - lifecycle payments
  const balance = family.openBalance + totalPayments - totalWithdrawals - totalLifecyclePayments
  
  return {
    openingBalance: family.openBalance,
    totalPayments,
    totalWithdrawals,
    totalLifecyclePayments,
    balance
  }
}

