import { Family, FamilyMember, PaymentPlan, Payment, LifecycleEventPayment } from './models'
import connectDB from './database'
import { calculateAge, getAgeGroup } from './calculations'

export interface ProjectionYear {
  year: number
  month: number
  date: Date
  projectedRevenue: number
  memberCounts: {
    plan1: number
    plan2: number
    plan3: number
    plan4: number
  }
  lifecycleEvents: Array<{
    type: string
    memberName: string
    date: Date
    amount?: number
  }>
  planChanges: Array<{
    memberName: string
    oldPlan: number
    newPlan: number
    date: Date
  }>
}

export interface FinancialProjection {
  startYear: number
  endYear: number
  totalProjectedRevenue: number
  monthlyProjections: ProjectionYear[]
  summary: {
    averageMonthlyRevenue: number
    peakRevenueMonth: ProjectionYear | null
    totalLifecycleEvents: number
    totalPlanChanges: number
  }
}

export interface ScenarioInput {
  planPriceChanges?: {
    plan1?: number
    plan2?: number
    plan3?: number
    plan4?: number
  }
  memberAdditions?: Array<{
    name: string
    birthDate: Date
    gender: string
  }>
  memberRemovals?: string[] // member IDs
  lifecycleEventChanges?: Array<{
    memberId: string
    eventType: string
    newDate: Date
  }>
}

/**
 * Calculate Bar Mitzvah date (13th birthday in Hebrew calendar)
 * For now, we'll use Gregorian calendar + 13 years as approximation
 */
function calculateBarMitzvahDate(birthDate: Date): Date {
  const barMitzvahDate = new Date(birthDate)
  barMitzvahDate.setFullYear(barMitzvahDate.getFullYear() + 13)
  return barMitzvahDate
}

/**
 * Get payment plan price for a given plan number
 */
async function getPlanPrice(planNumber: number, userId?: string): Promise<number> {
  await connectDB()
  
  const query: any = { planNumber }
  if (userId) {
    query.userId = userId
  }
  
  const plan = await PaymentPlan.findOne(query).lean()
  if (plan) {
    return (plan as any).yearlyPrice || 0
  }
  
  // Fallback to default prices
  const defaultPrices: Record<number, number> = {
    1: 1200,
    2: 1500,
    3: 1800,
    4: 2500
  }
  return defaultPrices[planNumber] || 0
}

/**
 * Generate financial projection for a user's families
 */
export async function generateFinancialProjection(
  userId: string,
  years: number = 5,
  scenario?: ScenarioInput
): Promise<FinancialProjection> {
  await connectDB()
  
  const today = new Date()
  const startYear = today.getFullYear()
  const endYear = startYear + years
  
  // Get all families for this user
  const families = await Family.find({ userId }).populate('members').lean()
  const familyIds = families.map(f => f._id)
  
  // Get all members
  let members = await FamilyMember.find({ familyId: { $in: familyIds } }).lean()
  
  // Apply scenario changes
  if (scenario) {
    // Add new members
    if (scenario.memberAdditions) {
      for (const newMember of scenario.memberAdditions) {
        members.push({
          _id: `scenario_${Date.now()}_${Math.random()}` as any,
          firstName: newMember.name.split(' ')[0] || 'New',
          lastName: newMember.name.split(' ').slice(1).join(' ') || 'Member',
          birthDate: newMember.birthDate,
          gender: newMember.gender,
          paymentPlan: getAgeGroup(calculateAge(newMember.birthDate)),
          familyId: families[0]?._id || null,
        } as any)
      }
    }
    
    // Remove members
    if (scenario.memberRemovals) {
      members = members.filter(m => !scenario.memberRemovals!.includes(m._id.toString()))
    }
  }
  
  // Get payment plan prices
  const planPrices: Record<number, number> = {}
  for (let planNum = 1; planNum <= 4; planNum++) {
    if (scenario?.planPriceChanges?.[`plan${planNum}` as keyof typeof scenario.planPriceChanges]) {
      planPrices[planNum] = scenario.planPriceChanges[`plan${planNum}` as keyof typeof scenario.planPriceChanges] as number
    } else {
      planPrices[planNum] = await getPlanPrice(planNum, userId)
    }
  }
  
  const monthlyProjections: ProjectionYear[] = []
  let totalProjectedRevenue = 0
  
  // Generate monthly projections
  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      const projectionDate = new Date(year, month - 1, 1)
      if (projectionDate < today) continue // Skip past months
      
      const memberCounts = { plan1: 0, plan2: 0, plan3: 0, plan4: 0 }
      const lifecycleEvents: ProjectionYear['lifecycleEvents'] = []
      const planChanges: ProjectionYear['planChanges'] = []
      
      // Calculate member ages and plans for this month
      for (const member of members) {
        if (!member.birthDate) continue
        
        const age = calculateAge(new Date(member.birthDate), projectionDate)
        const currentPlan = (member as any).paymentPlan || getAgeGroup(age)
        const projectedPlan = getAgeGroup(age)
        
        // Track plan changes
        if (currentPlan !== projectedPlan && projectionDate.getTime() === new Date(year, month - 1, 1).getTime()) {
          planChanges.push({
            memberName: `${(member as any).firstName} ${(member as any).lastName}`,
            oldPlan: currentPlan,
            newPlan: projectedPlan,
            date: projectionDate
          })
        }
        
        memberCounts[`plan${projectedPlan}` as keyof typeof memberCounts]++
        
        // Check for Bar Mitzvah (male, turning 13)
        if ((member as any).gender === 'male') {
          const barMitzvahDate = calculateBarMitzvahDate(new Date(member.birthDate))
          if (barMitzvahDate.getFullYear() === year && barMitzvahDate.getMonth() === month - 1) {
            lifecycleEvents.push({
              type: 'bar_mitzvah',
              memberName: `${(member as any).firstName} ${(member as any).lastName}`,
              date: barMitzvahDate,
              amount: 0 // Can be configured
            })
          }
        }
      }
      
      // Calculate projected revenue (monthly amount = yearly / 12)
      const monthlyRevenue = 
        (memberCounts.plan1 * planPrices[1] / 12) +
        (memberCounts.plan2 * planPrices[2] / 12) +
        (memberCounts.plan3 * planPrices[3] / 12) +
        (memberCounts.plan4 * planPrices[4] / 12)
      
      totalProjectedRevenue += monthlyRevenue
      
      monthlyProjections.push({
        year,
        month,
        date: projectionDate,
        projectedRevenue: monthlyRevenue,
        memberCounts,
        lifecycleEvents,
        planChanges
      })
    }
  }
  
  // Calculate summary
  const averageMonthlyRevenue = monthlyProjections.length > 0 
    ? totalProjectedRevenue / monthlyProjections.length 
    : 0
  
  const peakRevenueMonth = monthlyProjections.reduce((peak, current) => 
    current.projectedRevenue > (peak?.projectedRevenue || 0) ? current : peak
  , null as ProjectionYear | null)
  
  const totalLifecycleEvents = monthlyProjections.reduce((sum, p) => sum + p.lifecycleEvents.length, 0)
  const totalPlanChanges = monthlyProjections.reduce((sum, p) => sum + p.planChanges.length, 0)
  
  return {
    startYear,
    endYear,
    totalProjectedRevenue,
    monthlyProjections,
    summary: {
      averageMonthlyRevenue,
      peakRevenueMonth,
      totalLifecycleEvents,
      totalPlanChanges
    }
  }
}

/**
 * Generate cash flow forecast
 */
export async function generateCashFlowForecast(
  userId: string,
  months: number = 12
): Promise<{
  monthlyCashFlow: Array<{
    month: string
    date: Date
    projectedIncome: number
    projectedExpenses: number
    netCashFlow: number
    cumulativeCashFlow: number
  }>
  summary: {
    totalIncome: number
    totalExpenses: number
    netCashFlow: number
    averageMonthlyCashFlow: number
  }
}> {
  await connectDB()
  
  const today = new Date()
  const monthlyCashFlow: any[] = []
  let cumulativeCashFlow = 0
  
  // Get historical payment data for trend analysis
  const families = await Family.find({ userId }).select('_id').lean()
  const familyIds = families.map(f => f._id)
  
  const historicalPayments = await Payment.find({
    familyId: { $in: familyIds },
    paymentDate: { $gte: new Date(today.getFullYear() - 1, 0, 1) }
  }).sort({ paymentDate: 1 }).lean()
  
  // Calculate average monthly income from historical data
  const monthlyIncomeMap: Record<string, number> = {}
  historicalPayments.forEach((p: any) => {
    const monthKey = `${new Date(p.paymentDate).getFullYear()}-${new Date(p.paymentDate).getMonth() + 1}`
    monthlyIncomeMap[monthKey] = (monthlyIncomeMap[monthKey] || 0) + (p.amount || 0)
  })
  
  const averageHistoricalIncome = Object.values(monthlyIncomeMap).reduce((sum, val) => sum + val, 0) / 
    (Object.keys(monthlyIncomeMap).length || 1)
  
  // Generate projection
  const projection = await generateFinancialProjection(userId, Math.ceil(months / 12))
  
  for (let i = 0; i < months; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`
    
    // Get projected income from projection
    const monthProjection = projection.monthlyProjections.find(
      p => p.year === date.getFullYear() && p.month === date.getMonth() + 1
    )
    
    const projectedIncome = monthProjection?.projectedRevenue || averageHistoricalIncome
    const projectedExpenses = 0 // Can be enhanced with expense tracking
    const netCashFlow = projectedIncome - projectedExpenses
    cumulativeCashFlow += netCashFlow
    
    monthlyCashFlow.push({
      month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      date,
      projectedIncome,
      projectedExpenses,
      netCashFlow,
      cumulativeCashFlow
    })
  }
  
  const totalIncome = monthlyCashFlow.reduce((sum, m) => sum + m.projectedIncome, 0)
  const totalExpenses = monthlyCashFlow.reduce((sum, m) => sum + m.projectedExpenses, 0)
  const netCashFlow = totalIncome - totalExpenses
  const averageMonthlyCashFlow = netCashFlow / months
  
  return {
    monthlyCashFlow,
    summary: {
      totalIncome,
      totalExpenses,
      netCashFlow,
      averageMonthlyCashFlow
    }
  }
}

