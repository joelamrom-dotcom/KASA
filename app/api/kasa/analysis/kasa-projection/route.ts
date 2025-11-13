import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { YearlyCalculation, LifecycleEventPayment, Payment, Family, FamilyMember } from '@/lib/models'
import { calculateYearlyIncome, calculateYearlyExpenses, calculateYearlyBalance } from '@/lib/calculations'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const yearsAhead = parseInt(searchParams.get('years') || '10')
    const currentYear = new Date().getFullYear()
    
    // Get historical yearly calculations
    const historicalCalculations = await YearlyCalculation.find({})
      .sort({ year: 1 })
      .lean()
    
    // Get all lifecycle events
    const lifecycleEvents = await LifecycleEventPayment.find({})
      .sort({ eventDate: 1 })
      .lean()
    
    // Get all payments
    const allPayments = await Payment.find({})
      .sort({ paymentDate: 1 })
      .lean()
    
    // Get families and members for future projections
    const families = await Family.find({}).lean()
    const members = await FamilyMember.find({}).lean()
    
    // Group lifecycle events by year
    const eventsByYear: { [year: number]: any } = {}
    lifecycleEvents.forEach(event => {
      const year = event.eventDate ? new Date(event.eventDate).getFullYear() : event.year || currentYear
      if (!eventsByYear[year]) {
        eventsByYear[year] = {
          weddings: 0,
          barMitzvahs: 0,
          births: 0,
          totalAmount: 0,
          events: []
        }
      }
      eventsByYear[year].events.push(event)
      eventsByYear[year].totalAmount += event.amount || 0
      
      if (event.eventType === 'chasena' || event.eventType === 'wedding') {
        eventsByYear[year].weddings += 1
      } else if (event.eventType === 'bar mitzvah' || event.eventType === 'bar_mitzvah') {
        eventsByYear[year].barMitzvahs += 1
      } else if (event.eventType === 'birth' || event.eventType === 'birth_boy' || event.eventType === 'birth_girl') {
        eventsByYear[year].births += 1
      }
    })
    
    // Group payments by year
    const paymentsByYear: { [year: number]: { total: number, count: number } } = {}
    allPayments.forEach(payment => {
      const year = payment.year || (payment.paymentDate ? new Date(payment.paymentDate).getFullYear() : currentYear)
      if (!paymentsByYear[year]) {
        paymentsByYear[year] = { total: 0, count: 0 }
      }
      paymentsByYear[year].total += payment.amount || 0
      paymentsByYear[year].count += 1
    })
    
    // Build comprehensive year-by-year data
    const startYear = Math.min(
      ...historicalCalculations.map(c => c.year),
      ...Object.keys(eventsByYear).map(y => parseInt(y)),
      ...Object.keys(paymentsByYear).map(y => parseInt(y)),
      currentYear - 10
    )
    
    const endYear = currentYear + yearsAhead
    const yearData: any[] = []
    
    for (let year = startYear; year <= endYear; year++) {
      const calc = historicalCalculations.find(c => c.year === year)
      const events = eventsByYear[year] || { weddings: 0, barMitzvahs: 0, births: 0, totalAmount: 0, events: [] }
      const payments = paymentsByYear[year] || { total: 0, count: 0 }
      
      let incomeData, expenseData, balanceData
      
      if (calc) {
        // Use existing calculation
        incomeData = {
          planIncome: calc.planIncome || calc.totalIncome || 0,
          extraDonation: calc.extraDonation || 0,
          calculatedIncome: calc.calculatedIncome || calc.totalIncome || 0,
          totalPayments: calc.totalPayments || payments.total
        }
        expenseData = {
          totalExpenses: calc.totalExpenses || 0,
          extraExpense: calc.extraExpense || 0,
          calculatedExpenses: calc.calculatedExpenses || calc.totalExpenses || 0,
          lifecycleEvents: events.totalAmount
        }
        balanceData = {
          balance: calc.balance || 0,
          netIncome: calc.netIncome || 0
        }
      } else if (year <= currentYear) {
        // Calculate for historical year without calculation record
        try {
          incomeData = await calculateYearlyIncome(year, 0)
          expenseData = await calculateYearlyExpenses(year, 0)
          balanceData = await calculateYearlyBalance(year, 0, 0)
        } catch (error) {
          console.error(`Error calculating for year ${year}:`, error)
          incomeData = { planIncome: 0, extraDonation: 0, calculatedIncome: 0, totalPayments: payments.total }
          expenseData = { totalExpenses: 0, extraExpense: 0, calculatedExpenses: 0, lifecycleEvents: events.totalAmount }
          balanceData = { balance: 0, netIncome: 0 }
        }
      } else {
        // Future projection - estimate based on trends
        const recentYears = yearData.slice(-5).filter(d => d.year < year)
        const avgIncome = recentYears.length > 0 
          ? recentYears.reduce((sum, d) => sum + (d.income?.calculatedIncome || 0), 0) / recentYears.length
          : 0
        const avgExpenses = recentYears.length > 0
          ? recentYears.reduce((sum, d) => sum + (d.expenses?.calculatedExpenses || 0), 0) / recentYears.length
          : 0
        
        // Simple trend projection (can be enhanced with ML)
        const yearsFromNow = year - currentYear
        const growthRate = 0.02 // 2% annual growth estimate
        
        incomeData = {
          planIncome: avgIncome * Math.pow(1 + growthRate, yearsFromNow),
          extraDonation: 0,
          calculatedIncome: avgIncome * Math.pow(1 + growthRate, yearsFromNow),
          totalPayments: avgIncome * Math.pow(1 + growthRate, yearsFromNow) * 0.9 // Estimate 90% collection rate
        }
        
        expenseData = {
          totalExpenses: avgExpenses * Math.pow(1 + growthRate, yearsFromNow),
          extraExpense: 0,
          calculatedExpenses: avgExpenses * Math.pow(1 + growthRate, yearsFromNow),
          lifecycleEvents: events.totalAmount
        }
        
        balanceData = {
          balance: incomeData.calculatedIncome - expenseData.calculatedExpenses,
          netIncome: incomeData.calculatedIncome - expenseData.calculatedExpenses
        }
      }
      
      yearData.push({
        year,
        isHistorical: year <= currentYear,
        isProjected: year > currentYear,
        income: incomeData,
        expenses: expenseData,
        balance: balanceData,
        events: {
          weddings: events.weddings,
          barMitzvahs: events.barMitzvahs,
          births: events.births,
          totalEvents: events.events.length,
          totalAmount: events.totalAmount
        },
        payments: {
          total: payments.total,
          count: payments.count,
          average: payments.count > 0 ? payments.total / payments.count : 0
        }
      })
    }
    
    // Calculate cumulative balance
    let cumulativeBalance = 0
    const enrichedYearData = yearData.map(data => {
      cumulativeBalance += data.balance.netIncome || 0
      return {
        ...data,
        cumulativeBalance
      }
    })
    
    // Calculate averages
    const historicalData = enrichedYearData.filter(d => d.isHistorical)
    const averages = {
      avgIncome: historicalData.length > 0
        ? historicalData.reduce((sum, d) => sum + (d.income?.calculatedIncome || 0), 0) / historicalData.length
        : 0,
      avgExpenses: historicalData.length > 0
        ? historicalData.reduce((sum, d) => sum + (d.expenses?.calculatedExpenses || 0), 0) / historicalData.length
        : 0,
      avgBalance: historicalData.length > 0
        ? historicalData.reduce((sum, d) => sum + (d.balance?.netIncome || 0), 0) / historicalData.length
        : 0,
      avgWeddings: historicalData.length > 0
        ? historicalData.reduce((sum, d) => sum + (d.events?.weddings || 0), 0) / historicalData.length
        : 0,
      avgBirths: historicalData.length > 0
        ? historicalData.reduce((sum, d) => sum + (d.events?.births || 0), 0) / historicalData.length
        : 0,
      avgPayments: historicalData.length > 0
        ? historicalData.reduce((sum, d) => sum + (d.payments?.total || 0), 0) / historicalData.length
        : 0
    }
    
    return NextResponse.json({
      yearData: enrichedYearData,
      averages,
      summary: {
        startYear,
        endYear,
        currentYear,
        totalYears: endYear - startYear + 1,
        historicalYears: historicalData.length,
        projectedYears: yearsAhead
      }
    })
  } catch (error: any) {
    console.error('Error generating kasa projection:', error)
    return NextResponse.json(
      { error: 'Failed to generate kasa projection', details: error.message },
      { status: 500 }
    )
  }
}

