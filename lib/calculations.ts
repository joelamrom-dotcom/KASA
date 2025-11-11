import { Family, FamilyMember, Payment, Withdrawal, LifecycleEventPayment, YearlyCalculation, PaymentPlan, LifecycleEvent } from './models'
import connectDB from './database'

// Payment plan amounts (matching Excel)
const PAYMENT_PLANS = {
  1: { ageStart: 0, ageEnd: 4, amount: 1200 },
  2: { ageStart: 5, ageEnd: 8, amount: 1500 },
  3: { ageStart: 9, ageEnd: 16, amount: 1800 },
  4: { ageStart: 17, ageEnd: null, amount: 2500 }
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
 * Count members by payment plan for a given year
 * Payment plans are family-based, except males at 13+ Hebrew years get Plan 3 (Bucher Plan)
 */
export async function countMembersByPaymentPlan(year: number) {
  await connectDB()
  
  const families = await Family.find({})
  const counts = {
    plan1: 0,
    plan2: 0,
    plan3: 0,
    plan4: 0
  }
  
    for (const family of families) {
      const members = await FamilyMember.find({ familyId: family._id })
      
      // Get family's payment plan by ID
      let familyPlanNumber = null
      if (family.paymentPlanId) {
        const paymentPlan = await PaymentPlan.findById(family.paymentPlanId)
        if (paymentPlan && paymentPlan.planNumber) {
          familyPlanNumber = paymentPlan.planNumber
        }
      }
      
      // If no paymentPlanId, skip this family (should not happen in ID-based system)
      if (!familyPlanNumber) {
        console.warn(`Family ${family._id} does not have a valid paymentPlanId`)
        continue
      }
      
      const familyPlan = familyPlanNumber
    
    for (const member of members) {
      // Check if male has reached 13 in Hebrew years (has bucher plan)
      if (member.paymentPlan === 3 && member.gender === 'male' && member.paymentPlanAssigned) {
        counts.plan3++
      } else {
        // Use family's payment plan
        switch (familyPlan) {
          case 1:
            counts.plan1++
            break
          case 2:
            counts.plan2++
            break
          case 3:
            counts.plan3++
            break
          case 4:
            counts.plan4++
            break
        }
      }
    }
  }
  
  return counts
}

/**
 * Count members in each age group for a given year (DEPRECATED - kept for backward compatibility)
 * @deprecated Use countMembersByPaymentPlan instead - payment plans are now family-based
 */
export async function countMembersByAgeGroup(year: number) {
  await connectDB()
  
  const families = await Family.find({})
  const allMembers: any[] = []
  
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
 * Calculate income for each payment plan group
 */
export function calculateIncomeByPaymentPlan(counts: {
  plan1: number
  plan2: number
  plan3: number
  plan4: number
}) {
  return {
    incomePlan1: counts.plan1 * PAYMENT_PLANS[1].amount,
    incomePlan2: counts.plan2 * PAYMENT_PLANS[2].amount,
    incomePlan3: counts.plan3 * PAYMENT_PLANS[3].amount,
    incomePlan4: counts.plan4 * PAYMENT_PLANS[4].amount
  }
}

/**
 * Calculate income for each age group (DEPRECATED - kept for backward compatibility)
 * @deprecated Use calculateIncomeByPaymentPlan instead
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
 * Calculate total income for a year based on family payment plans
 */
export async function calculateYearlyIncome(year: number, extraDonation: number = 0) {
  await connectDB()
  
  const counts = await countMembersByPaymentPlan(year)
  const incomeByPlan = calculateIncomeByPaymentPlan(counts)
  
  // Get all payments from this year
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31, 23, 59, 59)
  
  const payments = await Payment.find({
    $or: [
      { year: year }, // Primary: use the year field
      { paymentDate: { $gte: startDate, $lte: endDate } } // Fallback: use date range
    ]
  })
  
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0)
  console.log(`Found ${payments.length} payments for year ${year}, total: $${totalPayments}`)
  
  // Get payment plan names
  const paymentPlans = await PaymentPlan.find({}).sort({ planNumber: 1 })
  const planNames: { [key: number]: string } = {}
  paymentPlans.forEach(plan => {
    if (plan.planNumber) {
      planNames[plan.planNumber] = plan.name
    }
  })
  
  const plan1Name = planNames[1] || 'Plan 1'
  const plan2Name = planNames[2] || 'Plan 2'
  const plan3Name = planNames[3] || 'Plan 3'
  const plan4Name = planNames[4] || 'Plan 4'
  
  const planIncome = 
    incomeByPlan.incomePlan1 +
    incomeByPlan.incomePlan2 +
    incomeByPlan.incomePlan3 +
    incomeByPlan.incomePlan4
  
  const totalIncome = planIncome + totalPayments
  const calculatedIncome = totalIncome + extraDonation
  
  return {
    // Plan-based data with names
    plan1: counts.plan1,
    plan2: counts.plan2,
    plan3: counts.plan3,
    plan4: counts.plan4,
    plan1Name,
    plan2Name,
    plan3Name,
    plan4Name,
    incomePlan1: incomeByPlan.incomePlan1,
    incomePlan2: incomeByPlan.incomePlan2,
    incomePlan3: incomeByPlan.incomePlan3,
    incomePlan4: incomeByPlan.incomePlan4,
    // Payments from the year
    totalPayments,
    planIncome,
    // Backward compatibility fields
    ageGroup0to4: counts.plan1,
    ageGroup5to8: counts.plan2,
    ageGroup9to16: counts.plan3,
    ageGroup17plus: counts.plan4,
    incomeAgeGroup0to4: incomeByPlan.incomePlan1,
    incomeAgeGroup5to8: incomeByPlan.incomePlan2,
    incomeAgeGroup9to16: incomeByPlan.incomePlan3,
    incomeAgeGroup17plus: incomeByPlan.incomePlan4,
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
  
  // Query by year field - this is the primary way events are stored
  const events = await LifecycleEventPayment.find({
    year: year
  })
  
  console.log(`Found ${events.length} lifecycle events for year ${year}`)
  const barMitzvahs = events.filter(e => e.eventType === 'bar_mitzvah')
  console.log(`Bar Mitzvahs: ${barMitzvahs.length} events, total: $${barMitzvahs.reduce((sum, e) => sum + e.amount, 0)}`)
  
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
 * Update yearly calculation when a lifecycle event is added
 * Preserves existing extraDonation and extraExpense values
 */
export async function updateYearlyCalculationForEvent(eventYear: number) {
  try {
    await connectDB()
    
    // Get existing calculation to preserve extraDonation and extraExpense
    const existingCalc = await YearlyCalculation.findOne({ year: eventYear })
    const extraDonation = existingCalc?.extraDonation || 0
    const extraExpense = existingCalc?.extraExpense || 0
    
    // Recalculate the year (this will include the new event)
    await calculateAndSaveYear(eventYear, extraDonation, extraExpense)
    
    console.log(`✅ Updated yearly calculation for year ${eventYear}`)
  } catch (error) {
    console.error(`Error updating yearly calculation for year ${eventYear}:`, error)
    // Don't throw - this is a background update
  }
}

/**
 * Calculate balance for a specific family
 */
export async function calculateFamilyBalance(familyId: string, asOfDate: Date = new Date()) {
  await connectDB()
  
  const family = await Family.findById(familyId)
  if (!family) throw new Error('Family not found')
  
  // Get payment plan cost - ONLY use paymentPlanId (ID-based system)
  let planCost = 0
  
  if (!family.paymentPlanId) {
    console.error(`❌ Family ${familyId} does not have paymentPlanId set. Returning 0 for planCost.`)
    // Return balance with planCost = 0 instead of throwing
    // This allows the page to load even if paymentPlanId is missing
    planCost = 0
  } else {
    try {
      const paymentPlan = await PaymentPlan.findById(family.paymentPlanId)
      
      if (!paymentPlan) {
        console.error(`❌ Payment plan with ID ${family.paymentPlanId} not found. Returning 0 for planCost.`)
        planCost = 0
      } else {
        planCost = paymentPlan.yearlyPrice || 0
        console.log(`✅ Using paymentPlanId: ${family.paymentPlanId} -> ${paymentPlan.name} - $${planCost}`)
      }
    } catch (error) {
      console.error(`❌ Error fetching payment plan by ID ${family.paymentPlanId}:`, error)
      planCost = 0 // Continue with planCost = 0 instead of throwing
    }
  }
  
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
  
  // Get all lifecycle event payments up to date (for display only, not included in balance)
  const lifecyclePayments = await LifecycleEventPayment.find({
    familyId,
    eventDate: { $lte: asOfDate }
  })
  
  const totalLifecyclePayments = lifecyclePayments.reduce((sum, p) => sum + p.amount, 0)
  
  // Calculate balance: payments - withdrawals - plan cost
  // Opening balance is deprecated and no longer used
  // Lifecycle events are NOT included in balance calculation (they are informational only)
  // Plan cost is deducted because families owe the annual plan amount
  const balance = totalPayments - totalWithdrawals - planCost
  
  return {
    openingBalance: family.openBalance, // Show actual opening balance as set
    planCost, // Plan cost deducted from balance
    totalPayments,
    totalWithdrawals,
    totalLifecyclePayments, // Included for display purposes only
    balance
  }
}

/**
 * Calculate balance for a specific member
 */
export async function calculateMemberBalance(memberId: string, asOfDate: Date = new Date()) {
  await connectDB()
  
  const member = await FamilyMember.findById(memberId)
  if (!member) throw new Error('Member not found')
  
  // Get member's payment plan cost
  let planCost = 0
  
  if (member.paymentPlanId) {
    try {
      const paymentPlan = await PaymentPlan.findById(member.paymentPlanId)
      if (paymentPlan) {
        planCost = paymentPlan.yearlyPrice || 0
      }
    } catch (error) {
      console.error(`Error fetching payment plan for member ${memberId}:`, error)
    }
  } else if (member.paymentPlan && member.paymentPlanAssigned) {
    // Fallback to legacy payment plan number system
    const fallbackPrices: { [key: number]: number } = {
      1: 1200,
      2: 1500,
      3: 1800,
      4: 2500
    }
    planCost = fallbackPrices[member.paymentPlan] || 0
  }
  
  // Get all member-specific payments up to date
  const payments = await Payment.find({
    memberId,
    paymentDate: { $lte: asOfDate }
  })
  
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0)
  
  // Get all lifecycle event payments for this member up to date (for display only, not included in balance)
  const lifecyclePayments = await LifecycleEventPayment.find({
    memberId,
    eventDate: { $lte: asOfDate }
  })
  
  const totalLifecyclePayments = lifecyclePayments.reduce((sum, p) => sum + p.amount, 0)
  
  // Calculate balance: payments - plan cost
  // Members don't have withdrawals (those are family-level)
  // Lifecycle events are NOT included in balance calculation (they are informational only)
  const balance = totalPayments - planCost
  
  return {
    planCost,
    totalPayments,
    totalLifecyclePayments, // Included for display purposes only
    balance
  }
}

