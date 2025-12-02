import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { User, Family, Payment } from '@/lib/models'
import { calculateLevel } from '@/lib/gamification'

export const dynamic = 'force-dynamic'

// GET - Get leaderboard
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') || 'points' // 'points' | 'engagement' | 'families' | 'payments'

    const mongoose = require('mongoose')
    const allUsers = await User.find({ isActive: true }).select('_id email firstName lastName').lean()

    const leaderboard = await Promise.all(
      allUsers.map(async (u: any) => {
        const userId = u._id
        const familyCount = await Family.countDocuments({ userId })
        const paymentCount = await Payment.countDocuments({ userId })
        const totalPoints = (familyCount * 5) + (paymentCount * 3)
        const level = calculateLevel(totalPoints)

        return {
          userId: userId.toString(),
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          totalPoints,
          level,
          familyCount,
          paymentCount
        }
      })
    )

    // Sort by type
    leaderboard.sort((a, b) => {
      switch (type) {
        case 'engagement':
          return b.totalPoints - a.totalPoints
        case 'families':
          return b.familyCount - a.familyCount
        case 'payments':
          return b.paymentCount - a.paymentCount
        default:
          return b.totalPoints - a.totalPoints
      }
    })

    // Add rank
    const ranked = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }))

    // Find current user's rank
    const currentUserRank = ranked.findIndex(
      entry => entry.userId === user.userId
    ) + 1

    return NextResponse.json({
      leaderboard: ranked.slice(0, limit),
      currentUserRank: currentUserRank > 0 ? currentUserRank : null,
      type
    })
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard', details: error.message },
      { status: 500 }
    )
  }
}

