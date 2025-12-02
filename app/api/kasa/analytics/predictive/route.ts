import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, Payment, FamilyMember } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get predictive analytics
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const families = await Family.find({ userId }).lean()
    const familyIds = families.map((f: any) => f._id)

    // Get payment history
    const payments = await Payment.find({ familyId: { $in: familyIds } })
      .sort({ paymentDate: -1 })
      .limit(1000)
      .lean()

    // Calculate churn risk
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    
    const recentPayments = payments.filter((p: any) => new Date(p.paymentDate) >= sixMonthsAgo)
    const familiesWithRecentPayments = new Set(recentPayments.map((p: any) => p.familyId.toString()))
    
    const atRiskFamilies = families.filter((f: any) => 
      !familiesWithRecentPayments.has(f._id.toString())
    )

    // Revenue forecasting (simple linear projection)
    const monthlyRevenue = calculateMonthlyRevenue(payments)
    const projectedRevenue = projectRevenue(monthlyRevenue, 12) // 12 months

    // Member lifecycle predictions
    const members = await FamilyMember.find({ familyId: { $in: familyIds } }).lean()
    const upcomingBarMitzvahs = members.filter((m: any) => {
      if (!m.birthDate || !m.barMitzvahDate) return false
      const barMitzvahDate = new Date(m.barMitzvahDate)
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      return barMitzvahDate <= oneYearFromNow && barMitzvahDate >= now
    })

    return NextResponse.json({
      churnRisk: {
        atRiskCount: atRiskFamilies.length,
        atRiskPercentage: (atRiskFamilies.length / families.length) * 100,
        families: atRiskFamilies.slice(0, 10).map((f: any) => ({
          _id: f._id.toString(),
          name: f.name,
          lastPayment: getLastPaymentDate(f._id.toString(), payments)
        }))
      },
      revenueForecast: {
        currentMonthly: monthlyRevenue[monthlyRevenue.length - 1] || 0,
        projected: projectedRevenue
      },
      lifecyclePredictions: {
        upcomingBarMitzvahs: upcomingBarMitzvahs.length,
        events: upcomingBarMitzvahs.slice(0, 10).map((m: any) => ({
          memberName: `${m.firstName} ${m.lastName}`,
          barMitzvahDate: m.barMitzvahDate,
          familyId: m.familyId.toString()
        }))
      }
    })
  } catch (error: any) {
    console.error('Error calculating predictive analytics:', error)
    return NextResponse.json(
      { error: 'Failed to calculate analytics', details: error.message },
      { status: 500 }
    )
  }
}

function calculateMonthlyRevenue(payments: any[]): number[] {
  const monthly: { [key: string]: number } = {}
  
  payments.forEach((p: any) => {
    const date = new Date(p.paymentDate)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    monthly[key] = (monthly[key] || 0) + (p.amount || 0)
  })

  return Object.values(monthly).slice(-12) // Last 12 months
}

function projectRevenue(monthlyRevenue: number[], months: number): number[] {
  if (monthlyRevenue.length < 2) return []
  
  // Simple linear projection
  const avg = monthlyRevenue.reduce((a, b) => a + b, 0) / monthlyRevenue.length
  const trend = monthlyRevenue.length >= 2 
    ? (monthlyRevenue[monthlyRevenue.length - 1] - monthlyRevenue[0]) / monthlyRevenue.length
    : 0

  const projected: number[] = []
  for (let i = 1; i <= months; i++) {
    projected.push(avg + (trend * i))
  }

  return projected
}

function getLastPaymentDate(familyId: string, payments: any[]): string | null {
  const familyPayments = payments.filter((p: any) => p.familyId.toString() === familyId)
  if (familyPayments.length === 0) return null
  
  const lastPayment = familyPayments.sort((a: any, b: any) => 
    new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  )[0]
  
  return lastPayment.paymentDate
}

