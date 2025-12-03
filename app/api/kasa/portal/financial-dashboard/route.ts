import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Payment, Family, RecurringPayment } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get financial dashboard data for current family (family portal)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only family role users can access this
    if (user.role !== 'family') {
      return NextResponse.json(
        { error: 'Access denied. This endpoint is for family users only.' },
        { status: 403 }
      )
    }

    // Find family by familyId from user
    if (!user.familyId) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const familyResult = await Family.findById(user.familyId).lean()
    if (!familyResult) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const family = familyResult as any
    const familyId = String(family._id)
    const currentYear = new Date().getFullYear()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get payments this year
    const paymentsThisYear = await Payment.find({
      familyId,
      year: currentYear
    }).lean()

    const totalPaidThisYear = paymentsThisYear.reduce((sum, p) => sum + (p.amount || 0), 0)
    
    // Get upcoming recurring payments (next 30 days)
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const upcomingPayments = await RecurringPayment.find({
      familyId,
      isActive: true,
      nextPaymentDate: {
        $gte: today,
        $lte: thirtyDaysFromNow
      }
    }).sort({ nextPaymentDate: 1 }).lean()

    // Calculate monthly breakdown for this year
    const monthlyBreakdown: { month: number; amount: number }[] = []
    for (let month = 1; month <= 12; month++) {
      const monthStart = new Date(currentYear, month - 1, 1)
      const monthEnd = new Date(currentYear, month, 0)
      
      const monthPayments = paymentsThisYear.filter((p: any) => {
        const paymentDate = new Date(p.paymentDate)
        return paymentDate >= monthStart && paymentDate <= monthEnd
      })
      
      monthlyBreakdown.push({
        month,
        amount: monthPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
      })
    }

    // Get payment methods breakdown
    const paymentMethodsCount: Record<string, number> = {}
    paymentsThisYear.forEach((p: any) => {
      const method = p.paymentMethod || 'other'
      paymentMethodsCount[method] = (paymentMethodsCount[method] || 0) + 1
    })

    return NextResponse.json({
      totalPaidThisYear,
      paymentsThisYearCount: paymentsThisYear.length,
      upcomingPayments: upcomingPayments.map((p: any) => ({
        _id: p._id.toString(),
        amount: p.amount,
        nextPaymentDate: p.nextPaymentDate,
        frequency: p.frequency
      })),
      monthlyBreakdown,
      paymentMethodsBreakdown: paymentMethodsCount,
      currentBalance: (family as any).balance || 0
    })
  } catch (error: any) {
    console.error('Error fetching financial dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial dashboard', details: error.message },
      { status: 500 }
    )
  }
}

