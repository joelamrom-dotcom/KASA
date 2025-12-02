import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, Payment } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get family engagement scores
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const familyId = searchParams.get('familyId')

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    if (familyId) {
      // Get single family engagement
      const family = await Family.findById(familyId).lean()
      const payments = await Payment.find({ familyId }).sort({ paymentDate: -1 }).lean()
      
      const score = calculateEngagementScore(family, payments)
      
      return NextResponse.json({ familyId, score })
    } else {
      // Get all families engagement
      const families = await Family.find({ userId }).lean()
      const familyIds = families.map((f: any) => f._id)
      const payments = await Payment.find({ familyId: { $in: familyIds } }).lean()

      const engagementScores = families.map((family: any) => {
        const familyPayments = payments.filter((p: any) => 
          p.familyId.toString() === family._id.toString()
        )
        return {
          familyId: family._id.toString(),
          familyName: family.name,
          score: calculateEngagementScore(family, familyPayments)
        }
      })

      return NextResponse.json({ engagementScores: engagementScores.sort((a, b) => b.score - a.score) })
    }
  } catch (error: any) {
    console.error('Error calculating engagement:', error)
    return NextResponse.json(
      { error: 'Failed to calculate engagement', details: error.message },
      { status: 500 }
    )
  }
}

function calculateEngagementScore(family: any, payments: any[]): number {
  let score = 50 // Base score

  // Payment frequency
  if (payments.length > 0) {
    score += Math.min(30, payments.length * 2)
  }

  // Recent payments (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const recentPayments = payments.filter((p: any) => new Date(p.paymentDate) >= sixMonthsAgo)
  if (recentPayments.length > 0) {
    score += 20
  }

  // Complete profile
  if (family.email) score += 5
  if (family.phone) score += 5
  if (family.address) score += 5

  return Math.min(100, score)
}

