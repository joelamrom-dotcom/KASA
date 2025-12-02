import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Payment, Family, FamilyMember } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get advanced analytics data
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const years = parseInt(searchParams.get('years') || '3')
    const currentYear = new Date().getFullYear()

    // Get user's families
    const families = await Family.find({ userId: user.userId }).select('_id').lean()
    const familyIds = families.map(f => f._id)

    // Year-over-year comparison
    const yearOverYear: any[] = []
    for (let i = years - 1; i >= 0; i--) {
      const year = currentYear - i
      const yearStart = new Date(year, 0, 1)
      const yearEnd = new Date(year, 11, 31, 23, 59, 59)
      
      const payments = await Payment.find({
        familyId: { $in: familyIds },
        paymentDate: { $gte: yearStart, $lte: yearEnd }
      }).lean()

      const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
      const paymentCount = payments.length
      const averagePayment = paymentCount > 0 ? totalRevenue / paymentCount : 0

      yearOverYear.push({
        year,
        totalRevenue,
        paymentCount,
        averagePayment,
        monthlyBreakdown: Array.from({ length: 12 }, (_, month) => {
          const monthStart = new Date(year, month, 1)
          const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)
          const monthPayments = payments.filter((p: any) => {
            const paymentDate = new Date(p.paymentDate)
            return paymentDate >= monthStart && paymentDate <= monthEnd
          })
          return {
            month: month + 1,
            revenue: monthPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
            count: monthPayments.length
          }
        })
      })
    }

    // Payment trends analysis
    const trends = {
      revenueGrowth: yearOverYear.length >= 2
        ? ((yearOverYear[yearOverYear.length - 1].totalRevenue - yearOverYear[0].totalRevenue) / yearOverYear[0].totalRevenue) * 100
        : 0,
      paymentCountGrowth: yearOverYear.length >= 2
        ? ((yearOverYear[yearOverYear.length - 1].paymentCount - yearOverYear[0].paymentCount) / yearOverYear[0].paymentCount) * 100
        : 0,
      averagePaymentTrend: yearOverYear.length >= 2
        ? yearOverYear[yearOverYear.length - 1].averagePayment - yearOverYear[0].averagePayment
        : 0
    }

    // Predictive analytics - forecast next year based on trends
    const lastYear = yearOverYear[yearOverYear.length - 1]
    const nextYearProjection = {
      year: currentYear + 1,
      projectedRevenue: lastYear.totalRevenue * (1 + (trends.revenueGrowth / 100)),
      projectedPaymentCount: Math.round(lastYear.paymentCount * (1 + (trends.paymentCountGrowth / 100))),
      confidence: 'medium' // Can be enhanced with more sophisticated models
    }

    // Payment method trends
    const paymentMethodTrends: Record<string, number> = {}
    const allPayments = await Payment.find({
      familyId: { $in: familyIds },
      paymentDate: { $gte: new Date(currentYear - 1, 0, 1) }
    }).lean()

    allPayments.forEach((p: any) => {
      const method = p.paymentMethod || 'other'
      paymentMethodTrends[method] = (paymentMethodTrends[method] || 0) + 1
    })

    // Member growth
    const memberCounts = await FamilyMember.countDocuments({
      familyId: { $in: familyIds }
    })

    return NextResponse.json({
      yearOverYear,
      trends,
      nextYearProjection,
      paymentMethodTrends,
      memberCounts,
      totalFamilies: families.length
    })
  } catch (error: any) {
    console.error('Error fetching advanced analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    )
  }
}

