import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { User, Family, Payment, AuditLog } from '@/lib/models'
import { calculateLevel, calculateEngagementScore, BADGES, checkBadgeEligibility, getPointsForAction } from '@/lib/gamification'

export const dynamic = 'force-dynamic'

// GET - Get user gamification score
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Get user stats
    const familyCount = await Family.countDocuments({ userId })
    const paymentCount = await Payment.countDocuments({ userId })
    
    // Get user activity
    const dbUser = await User.findById(userId)
    const lastLogin = dbUser?.lastLogin || new Date()
    
    // Calculate days active (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentLogins = await AuditLog.countDocuments({
      userId,
      action: 'login',
      createdAt: { $gte: thirtyDaysAgo }
    })

    // Calculate total points (simplified - in production, store in user record)
    const totalPoints = (familyCount * 5) + (paymentCount * 3) + (recentLogins * 1)
    const level = calculateLevel(totalPoints)
    const pointsForNext = calculateLevel(level + 1) * 10 - totalPoints

    // Calculate engagement score
    const engagementScore = calculateEngagementScore({
      loginCount: recentLogins,
      paymentCount,
      familyCount,
      lastLogin,
      daysActive: Math.min(30, recentLogins)
    })

    // Check badge eligibility
    const userStats = {
      paymentCount,
      familyCount,
      analyticsViews: 0, // Would track this separately
      consecutiveLogins: 0, // Would track this separately
      teamCollaborations: 0, // Would track this separately
      featuresUsed: 5, // Estimate
      dataQualityScore: 95 // Estimate
    }

    const earnedBadges = BADGES.filter(badge => 
      checkBadgeEligibility(badge.id, userStats)
    ).map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      points: badge.points,
      category: badge.category
    }))

    const availableBadges = BADGES.filter(badge =>
      !earnedBadges.find(eb => eb.id === badge.id)
    ).map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      points: badge.points,
      category: badge.category,
      progress: getBadgeProgress(badge.id, userStats)
    }))

    return NextResponse.json({
      totalPoints,
      level,
      pointsForNext,
      engagementScore,
      earnedBadges,
      availableBadges,
      stats: userStats
    })
  } catch (error: any) {
    console.error('Error fetching gamification score:', error)
    return NextResponse.json(
      { error: 'Failed to fetch score', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Award points for an action
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    const points = getPointsForAction(action)
    
    // In production, update user's total points in database
    // For now, just return the points awarded
    
    return NextResponse.json({
      action,
      pointsAwarded: points,
      message: `Awarded ${points} points for ${action}`
    })
  } catch (error: any) {
    console.error('Error awarding points:', error)
    return NextResponse.json(
      { error: 'Failed to award points', details: error.message },
      { status: 500 }
    )
  }
}

function getBadgeProgress(badgeId: string, stats: any): number {
  switch (badgeId) {
    case 'first_payment':
      return Math.min(100, (stats.paymentCount / 1) * 100)
    case 'family_master':
      return Math.min(100, (stats.familyCount / 10) * 100)
    case 'payment_pro':
      return Math.min(100, (stats.paymentCount / 100) * 100)
    case 'analytics_expert':
      return Math.min(100, (stats.analyticsViews / 50) * 100)
    case 'early_bird':
      return Math.min(100, (stats.consecutiveLogins / 7) * 100)
    default:
      return 0
  }
}

