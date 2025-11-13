import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { 
  Family, 
  FamilyMember, 
  LifecycleEventPayment, 
  Payment, 
  PaymentPlan,
  Statement,
  SavedPaymentMethod,
  RecurringPayment,
  EmailConfig
} from '@/lib/models'
import { performAnalysis } from '@/lib/ml-analysis'
import { calculateYearlyIncome } from '@/lib/calculations'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { question, analysisData } = body

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    // Fetch ALL data from database for comprehensive access
    const families = await Family.find({}).lean()
    const members = await FamilyMember.find({}).lean()
    const lifecycleEvents = await LifecycleEventPayment.find({}).lean()
    const payments = await Payment.find({}).lean()
    const paymentPlans = await PaymentPlan.find({}).lean()
    const statements = await Statement.find({}).lean()
    const savedPaymentMethods = await SavedPaymentMethod.find({}).lean()
    const recurringPayments = await RecurringPayment.find({}).lean()
    const emailConfigs = await EmailConfig.find({}).lean()
    
    const currentYear = new Date().getFullYear()

    // Prepare analysis data if not provided
    let data = analysisData
    if (!data) {
      data = {
        families: families.map((f: any) => ({
          _id: (f._id as any)?.toString() || String(f._id),
          weddingDate: f.weddingDate ? (f.weddingDate as Date).toISOString() : null,
          name: f.name,
          createdAt: f.createdAt ? (f.createdAt as Date).toISOString() : null
        })),
        members: members.map((m: any) => ({
          _id: (m._id as any)?.toString() || String(m._id),
          familyId: (m.familyId as any)?.toString() || String(m.familyId),
          birthDate: m.birthDate ? (m.birthDate as Date).toISOString() : null,
          weddingDate: m.weddingDate ? (m.weddingDate as Date).toISOString() : null,
          gender: m.gender
        })),
        lifecycleEvents: lifecycleEvents.map((e: any) => ({
          _id: (e._id as any)?.toString() || String(e._id),
          eventType: e.eventType,
          eventDate: e.eventDate ? (e.eventDate as Date).toISOString() : null,
          year: e.year
        }))
      }
    }

    // Calculate payment statistics
    const totalPayments = payments.reduce((sum, p: any) => sum + (p.amount || 0), 0)
    const paymentsThisYear = payments.filter((p: any) => {
      const paymentYear = p.year || (p.paymentDate ? new Date(p.paymentDate).getFullYear() : null)
      return paymentYear === currentYear
    })
    const totalThisYear = paymentsThisYear.reduce((sum, p: any) => sum + (p.amount || 0), 0)
    
    // Payment methods breakdown
    const paymentMethods: { [key: string]: number } = {}
    payments.forEach((p: any) => {
      const method = p.paymentMethod || 'cash'
      paymentMethods[method] = (paymentMethods[method] || 0) + (p.amount || 0)
    })

    // Payments by year
    const paymentsByYear: { [year: number]: number } = {}
    payments.forEach((p: any) => {
      const year = p.year || (p.paymentDate ? new Date(p.paymentDate).getFullYear() : currentYear)
      paymentsByYear[year] = (paymentsByYear[year] || 0) + (p.amount || 0)
    })

    // Calculate yearly income for current year and future years
    let yearlyIncomeData: any = {}
    let futureYearIncomeData: { [year: number]: any } = {}
    try {
      yearlyIncomeData = await calculateYearlyIncome(currentYear, 0)
      // Calculate for next 5 years for projections
      for (let year = currentYear + 1; year <= currentYear + 5; year++) {
        try {
          futureYearIncomeData[year] = await calculateYearlyIncome(year, 0)
        } catch (error) {
          console.error(`Error calculating income for ${year}:`, error)
        }
      }
    } catch (error) {
      console.error('Error calculating yearly income:', error)
    }

    // Perform analysis
    const analysis = performAnalysis(data, 20)

    // Calculate additional statistics
    const totalStatements = statements.length
    const totalSavedPaymentMethods = savedPaymentMethods.length
    const activeRecurringPayments = recurringPayments.filter((r: any) => {
      const nextDate = r.nextPaymentDate ? new Date(r.nextPaymentDate) : null
      return nextDate && nextDate >= new Date()
    }).length

    // Families with details
    const familiesWithDetails = families.map((f: any) => ({
      name: f.name,
      hebrewName: f.hebrewName,
      email: f.email,
      phone: f.phone,
      openBalance: f.openBalance || 0,
      weddingDate: f.weddingDate ? new Date(f.weddingDate).toISOString() : null,
      address: f.address || f.street || '',
      city: f.city || '',
      state: f.state || ''
    }))

    // Payments with family details
    const paymentsWithDetails = payments.slice(0, 50).map((p: any) => ({
      amount: p.amount,
      paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString() : null,
      year: p.year,
      paymentMethod: p.paymentMethod,
      type: p.type,
      familyId: (p.familyId as any)?.toString() || String(p.familyId)
    }))

    // Build comprehensive context for AI with FULL database access
    const context = `
COMPREHENSIVE DATABASE SUMMARY - FULL ACCESS:

FAMILIES & MEMBERS:
- Total Families: ${analysis.stability_analysis.current_stats.total_families}
- Total Members: ${analysis.stability_analysis.current_stats.total_members}
- Average Children per Family: ${analysis.stability_analysis.current_stats.avg_children_per_family.toFixed(1)}
- Children Trend: ${analysis.children_analysis.statistics.trend}
- Average Children (Historical): ${analysis.children_analysis.statistics.average.toFixed(1)}
- Average Weddings per Year: ${analysis.weddings_analysis.statistics.average.toFixed(1)}
- Total Historical Weddings: ${analysis.weddings_analysis.statistics.total_historical}

FAMILY DETAILS (Sample - ${Math.min(10, familiesWithDetails.length)} of ${families.length}):
${familiesWithDetails.slice(0, 10).map((f: any) => 
  `- ${f.name}${f.hebrewName ? ` (${f.hebrewName})` : ''}: Email: ${f.email || 'N/A'}, Phone: ${f.phone || 'N/A'}, Balance: $${f.openBalance.toLocaleString()}, Address: ${f.address || ''} ${f.city || ''} ${f.state || ''}`.trim()
).join('\n')}

PAYMENTS & FINANCIAL DATA:
- Total Payments (All Time): $${totalPayments.toLocaleString()}
- Payments This Year (${currentYear}): $${totalThisYear.toLocaleString()}
- Number of Payments This Year: ${paymentsThisYear.length}
- Total Number of Payments: ${payments.length}
- Payment Methods Breakdown: ${Object.entries(paymentMethods).map(([method, amount]) => `${method}: $${amount.toLocaleString()}`).join(', ')}

RECENT PAYMENTS (Sample - ${Math.min(20, paymentsWithDetails.length)} of ${payments.length}):
${paymentsWithDetails.slice(0, 20).map((p: any) => 
  `- $${p.amount.toLocaleString()} on ${p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A'} (${p.paymentMethod || 'cash'}, ${p.type || 'membership'}, Year: ${p.year || 'N/A'})`
).join('\n')}

PAYMENT PLANS:
${paymentPlans.map((plan: any) => `- ${plan.name} (Plan ${plan.planNumber}): $${plan.yearlyPrice.toLocaleString()}/year${plan.description ? ` - ${plan.description}` : ''}`).join('\n')}

STATEMENTS:
- Total Statements: ${totalStatements}
${statements.slice(0, 5).map((s: any) => 
  `- Statement ${s.statementNumber || 'N/A'}: ${s.fromDate ? new Date(s.fromDate).toLocaleDateString() : ''} to ${s.toDate ? new Date(s.toDate).toLocaleDateString() : ''}, Status: ${s.status || 'N/A'}`
).join('\n')}

SAVED PAYMENT METHODS:
- Total Saved Payment Methods: ${totalSavedPaymentMethods}
${savedPaymentMethods.slice(0, 5).map((spm: any) => 
  `- ${spm.cardType || 'Card'} ending in ${spm.last4 || 'N/A'}, Expires: ${spm.expiryMonth || ''}/${spm.expiryYear || ''}`
).join('\n')}

RECURRING PAYMENTS:
- Total Recurring Payments: ${recurringPayments.length}
- Active Recurring Payments: ${activeRecurringPayments}
${recurringPayments.slice(0, 5).map((rp: any) => 
  `- $${rp.amount?.toLocaleString() || '0'} ${rp.frequency || 'monthly'}, Next: ${rp.nextPaymentDate ? new Date(rp.nextPaymentDate).toLocaleDateString() : 'N/A'}`
).join('\n')}

LIFECYCLE EVENTS:
- Total Lifecycle Events: ${lifecycleEvents.length}
${lifecycleEvents.slice(0, 10).map((e: any) => 
  `- ${e.eventType || 'Event'} on ${e.eventDate ? new Date(e.eventDate).toLocaleDateString() : 'N/A'}, Year: ${e.year || 'N/A'}`
).join('\n')}

YEARLY INCOME CALCULATION (${currentYear}):
- Plan Income: $${(yearlyIncomeData.planIncome || 0).toLocaleString()}
- Extra Donations: $${(yearlyIncomeData.extraDonation || 0).toLocaleString()}
- Calculated Income: $${(yearlyIncomeData.calculatedIncome || 0).toLocaleString()}
- Total Payments: $${(yearlyIncomeData.totalPayments || 0).toLocaleString()}

FUTURE YEAR PROJECTIONS (Income):
${Object.entries(futureYearIncomeData).map(([year, data]: [string, any]) => 
  `Year ${year}: Plan Income: $${(data.planIncome || 0).toLocaleString()}, Calculated Income: $${(data.calculatedIncome || 0).toLocaleString()}, Expected Payments: $${(data.totalPayments || 0).toLocaleString()}`
).join('\n')}

PAYMENTS BY YEAR:
${Object.entries(paymentsByYear).sort(([a], [b]) => parseInt(b) - parseInt(a)).slice(0, 10).map(([year, amount]) => `- ${year}: $${amount.toLocaleString()}`).join('\n')}

FUTURE PREDICTIONS (next 5 years):
${Object.keys(analysis.children_analysis.predictions).slice(0, 5).map(year => {
  const pred = analysis.children_analysis.predictions[parseInt(year)]
  return `Year ${year}: ${pred.predicted} children (range: ${pred.range_min}-${pred.range_max}, confidence: ${pred.confidence})`
}).join('\n')}

Wedding Predictions (next 5 years):
${Object.keys(analysis.weddings_analysis.predictions).slice(0, 5).map(year => {
  const pred = analysis.weddings_analysis.predictions[parseInt(year)]
  return `Year ${year}: ${pred.predicted} weddings (range: ${pred.range_min}-${pred.range_max}, confidence: ${pred.confidence})`
}).join('\n')}

DATABASE STATISTICS:
- Total Records: ${families.length} families, ${members.length} members, ${payments.length} payments, ${statements.length} statements, ${lifecycleEvents.length} lifecycle events
- Email Configurations: ${emailConfigs.length}
`.trim()

    // Use the existing AI chat endpoint logic
    const conversationHistory = [{
      role: 'system',
      content: `You are an expert data analyst with FULL ACCESS to the entire database. You have access to:
- All families with complete details (names, addresses, emails, phones, balances)
- All members with birth dates, wedding dates, gender
- All payments with amounts, dates, methods, types
- All payment plans with prices
- All statements
- All saved payment methods
- All recurring payments
- All lifecycle events
- Financial calculations and projections

Answer questions clearly and helpfully based on ALL available database data. You can answer questions about any family, member, payment, statement, or any other data in the system.`
    }]

    const fullPrompt = `${context}\n\nUser Question: ${question}\n\nPlease provide a clear, helpful answer based on the analysis data above.`

    // Prepare payment data for fallback
    const paymentData = {
      totalPayments,
      totalThisYear,
      paymentsThisYear: paymentsThisYear.length,
      totalPaymentsCount: payments.length,
      paymentMethods,
      paymentsByYear,
      yearlyIncome: yearlyIncomeData,
      futureYearIncome: futureYearIncomeData
    }

    // Try to use AI chat endpoint
    try {
      const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: fullPrompt,
          conversationHistory
        })
      })

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        return NextResponse.json({
          answer: aiData.response,
          provider: aiData.provider || 'ai',
          context: context
        })
      }
    } catch (error) {
      console.log('AI chat unavailable, using fallback')
    }

    // Fallback: Generate intelligent response based on question
    const answer = generateAnalysisAnswer(question, analysis, context, paymentData, futureYearIncomeData)

    return NextResponse.json({
      answer,
      provider: 'fallback',
      context: context
    })
  } catch (error: any) {
    console.error('Error in analysis query:', error)
    return NextResponse.json(
      { error: 'Failed to process query', details: error.message },
      { status: 500 }
    )
  }
}

function generateAnalysisAnswer(question: string, analysis: any, context: string, paymentData?: any, futureYearIncome?: any): string {
  const q = question.toLowerCase()

  // Extract year from question (e.g., "2026", "year 2026", "in 2026")
  const yearMatch = q.match(/\b(20\d{2})\b/)
  const requestedYear = yearMatch ? parseInt(yearMatch[1]) : null

  // Payment/Income-related questions
  if (q.includes('payment') || q.includes('paid') || q.includes('money') || q.includes('income') || q.includes('revenue') || q.includes('balance')) {
    if (paymentData) {
      const currentYear = new Date().getFullYear()
      
      // If specific year requested
      if (requestedYear) {
        if (requestedYear === currentYear) {
          return `Year ${currentYear} Financial Information:
- Plan Income: $${paymentData.yearlyIncome?.planIncome?.toLocaleString() || '0'}
- Extra Donations: $${paymentData.yearlyIncome?.extraDonation?.toLocaleString() || '0'}
- Calculated Income: $${paymentData.yearlyIncome?.calculatedIncome?.toLocaleString() || '0'}
- Total Payments (Actual): $${paymentData.totalThisYear.toLocaleString()}
- Number of Payments: ${paymentData.paymentsThisYear || 0}`
        } else if (requestedYear > currentYear && futureYearIncome && futureYearIncome[requestedYear]) {
          const yearData = futureYearIncome[requestedYear]
          return `Projected Financial Information for Year ${requestedYear}:
- Plan Income: $${(yearData.planIncome || 0).toLocaleString()}
- Calculated Income: $${(yearData.calculatedIncome || 0).toLocaleString()}
- Expected Payments: $${(yearData.totalPayments || 0).toLocaleString()}

Note: This is a projection based on current payment plans and expected family growth.`
        } else if (requestedYear < currentYear) {
          // Historical year
          const historicalPayments = paymentData.paymentsByYear?.[requestedYear] || 0
          return `Historical Financial Information for Year ${requestedYear}:
- Total Payments: $${historicalPayments.toLocaleString()}

Note: Historical income calculations are based on payment plans active during that year.`
        } else {
          return `I don't have specific data for year ${requestedYear}. Available years: ${currentYear} (current) and projections for ${currentYear + 1}-${currentYear + 5}.`
        }
      }
      
      // General payment/income question
      return `Payment & Financial Information:
- Total Payments (All Time): $${paymentData.totalPayments.toLocaleString()}
- Payments This Year (${currentYear}): $${paymentData.totalThisYear.toLocaleString()}
- Number of Payments This Year: ${paymentData.paymentsThisYear || 0}
- Total Number of Payments: ${paymentData.totalPaymentsCount}
- Payment Methods: ${Object.entries(paymentData.paymentMethods).map(([method, amount]: [string, any]) => `${method}: $${amount.toLocaleString()}`).join(', ')}

Yearly Income (${currentYear}):
- Plan Income: $${paymentData.yearlyIncome?.planIncome?.toLocaleString() || '0'}
- Extra Donations: $${paymentData.yearlyIncome?.extraDonation?.toLocaleString() || '0'}
- Calculated Income: $${paymentData.yearlyIncome?.calculatedIncome?.toLocaleString() || '0'}
- Total Payments: $${paymentData.yearlyIncome?.totalPayments?.toLocaleString() || '0'}

Recent Payments by Year:
${Object.entries(paymentData.paymentsByYear).sort(([a], [b]) => parseInt(b) - parseInt(a)).slice(0, 5).map(([year, amount]: [string, any]) => `- ${year}: $${amount.toLocaleString()}`).join('\n')}

To get projections for future years, ask: "What's the income for 2026?" or "Show me projections for 2027"`
    }
    return `Payment information is available. Please ask specific questions like:
- "How much was paid this year?"
- "What's the total income?"
- "What's the income for 2026?" (for future projections)
- "Show me payment methods breakdown"
- "What are the payments by year?"`
  }

  // Children-related questions
  if (q.includes('children') || q.includes('child')) {
    const firstPrediction = Object.values(analysis.children_analysis.predictions)[0] as { predicted: number } | undefined
    return `Based on the analysis:
- Current average children per family: ${analysis.stability_analysis.current_stats.avg_children_per_family.toFixed(1)}
- Historical average: ${analysis.children_analysis.statistics.average.toFixed(1)}
- Trend: ${analysis.children_analysis.statistics.trend}
- Projected children for next year: ${firstPrediction?.predicted || 'N/A'}

The analysis shows ${analysis.children_analysis.statistics.trend} trend in children per family.`
  }

  // Wedding-related questions
  if (q.includes('wedding') || q.includes('marriage')) {
    const firstWeddingPrediction = Object.values(analysis.weddings_analysis.predictions)[0] as { predicted: number } | undefined
    return `Wedding Analysis:
- Average weddings per year (historical): ${analysis.weddings_analysis.statistics.average.toFixed(1)}
- Total historical weddings: ${analysis.weddings_analysis.statistics.total_historical}
- Projected weddings for next year: ${firstWeddingPrediction?.predicted || 'N/A'}

The system predicts approximately ${analysis.weddings_analysis.statistics.average.toFixed(1)} weddings per year based on historical data.`
  }

  // Family-related questions
  if (q.includes('family') || q.includes('families')) {
    return `Family Statistics:
- Total families: ${analysis.stability_analysis.current_stats.total_families}
- Total members: ${analysis.stability_analysis.current_stats.total_members}
- Average children per family: ${analysis.stability_analysis.current_stats.avg_children_per_family.toFixed(1)}

The community has ${analysis.stability_analysis.current_stats.total_families} families with an average of ${analysis.stability_analysis.current_stats.avg_children_per_family.toFixed(1)} children per family.`
  }

  // Trend/projection questions
  if (q.includes('trend') || q.includes('future') || q.includes('projection')) {
    return `Future Projections:
- Children trend: ${analysis.children_analysis.statistics.trend}
- Average children per family: ${analysis.stability_analysis.current_stats.avg_children_per_family.toFixed(1)}
- Projected weddings per year: ${analysis.weddings_analysis.statistics.average.toFixed(1)}

Based on historical data, the community shows a ${analysis.children_analysis.statistics.trend} trend in children, with an average of ${analysis.weddings_analysis.statistics.average.toFixed(1)} weddings projected per year.`
  }

  // Default response
  return `I can answer questions about:
- Payments & Financial Data (total payments, income, payment methods, etc.)
- Families & Members (total families, members, children per family)
- Weddings (historical data, projections)
- Children (trends, projections)
- Future Trends & Projections

Please ask a specific question about your data!`
}

