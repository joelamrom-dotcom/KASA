import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { PaymentAnalytics, Payment, Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get payment analytics
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || '30' // days

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - parseInt(period) * 24 * 60 * 60 * 1000)

    // Get analytics data
    const analytics = await PaymentAnalytics.find({
      userId: userObjectId,
      date: { $gte: start, $lte: end }
    })
      .sort({ date: 1 })
      .lean()

    // Get payment data for detailed analysis
    const families = await Family.find({ userId: userObjectId }).select('_id').lean()
    const familyIds = families.map((f: any) => f._id)
    const payments = await Payment.find({
      familyId: { $in: familyIds },
      paymentDate: { $gte: start, $lte: end }
    }).lean()

    // Calculate totals
    const totals = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      successfulPayments: payments.filter(p => !p.refundedAmount || p.refundedAmount === 0).length,
      failedPayments: 0, // Would need to track failed payments
      averageAmount: 0,
      byMethod: {} as any,
      byType: {} as any,
      trends: [] as any[]
    }

    if (payments.length > 0) {
      totals.averageAmount = totals.totalAmount / payments.length
    }

    // Group by payment method
    payments.forEach((p: any) => {
      const method = p.paymentMethod || 'cash'
      if (!totals.byMethod[method]) {
        totals.byMethod[method] = { count: 0, amount: 0 }
      }
      totals.byMethod[method].count++
      totals.byMethod[method].amount += p.amount || 0
    })

    // Group by payment type
    payments.forEach((p: any) => {
      const type = p.type || 'membership'
      if (!totals.byType[type]) {
        totals.byType[type] = { count: 0, amount: 0 }
      }
      totals.byType[type].count++
      totals.byType[type].amount += p.amount || 0
    })

    // Calculate daily trends
    const dailyMap = new Map()
    payments.forEach((p: any) => {
      const date = new Date(p.paymentDate).toISOString().split('T')[0]
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, count: 0, amount: 0 })
      }
      const day = dailyMap.get(date)
      day.count++
      day.amount += p.amount || 0
    })
    totals.trends = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      period: { start, end },
      analytics,
      totals,
      payments: payments.slice(0, 100) // Limit to recent 100
    })
  } catch (error: any) {
    console.error('Error fetching payment analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    )
  }
}

