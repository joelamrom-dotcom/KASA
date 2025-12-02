/**
 * Gamification System
 * Badges, points, leaderboards, and engagement scoring
 */

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  points: number
  category: 'activity' | 'achievement' | 'milestone' | 'social'
}

export interface UserScore {
  userId: string
  totalPoints: number
  level: number
  badges: string[]
  engagementScore: number
  lastActivity: Date
}

// Badge definitions
export const BADGES: Badge[] = [
  {
    id: 'first_payment',
    name: 'First Payment',
    description: 'Recorded your first payment',
    icon: '💰',
    points: 10,
    category: 'milestone'
  },
  {
    id: 'family_master',
    name: 'Family Master',
    description: 'Added 10 families',
    icon: '👥',
    points: 50,
    category: 'achievement'
  },
  {
    id: 'payment_pro',
    name: 'Payment Pro',
    description: 'Processed 100 payments',
    icon: '💳',
    points: 100,
    category: 'achievement'
  },
  {
    id: 'analytics_expert',
    name: 'Analytics Expert',
    description: 'Viewed analytics 50 times',
    icon: '📊',
    points: 75,
    category: 'activity'
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Logged in 7 days in a row',
    icon: '🌅',
    points: 30,
    category: 'activity'
  },
  {
    id: 'team_player',
    name: 'Team Player',
    description: 'Collaborated with team members',
    icon: '🤝',
    points: 40,
    category: 'social'
  },
  {
    id: 'power_user',
    name: 'Power User',
    description: 'Used all major features',
    icon: '⚡',
    points: 150,
    category: 'achievement'
  },
  {
    id: 'data_guardian',
    name: 'Data Guardian',
    description: 'Maintained 100% data quality',
    icon: '🛡️',
    points: 80,
    category: 'achievement'
  }
]

// Calculate user level from points
export function calculateLevel(points: number): number {
  // Level formula: sqrt(points / 10)
  return Math.floor(Math.sqrt(points / 10)) + 1
}

// Calculate points needed for next level
export function pointsForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 10
}

// Calculate engagement score (0-100)
export function calculateEngagementScore(activities: {
  loginCount: number
  paymentCount: number
  familyCount: number
  lastLogin: Date
  daysActive: number
}): number {
  let score = 0

  // Login frequency (0-30 points)
  const daysSinceLastLogin = Math.floor(
    (Date.now() - new Date(activities.lastLogin).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysSinceLastLogin === 0) score += 30
  else if (daysSinceLastLogin <= 7) score += 20
  else if (daysSinceLastLogin <= 30) score += 10

  // Activity diversity (0-25 points)
  const activityTypes = [
    activities.loginCount > 0,
    activities.paymentCount > 0,
    activities.familyCount > 0
  ]
  score += (activityTypes.filter(Boolean).length / 3) * 25

  // Volume (0-25 points)
  const totalActions = activities.loginCount + activities.paymentCount + activities.familyCount
  if (totalActions > 100) score += 25
  else if (totalActions > 50) score += 15
  else if (totalActions > 10) score += 10

  // Consistency (0-20 points)
  if (activities.daysActive >= 30) score += 20
  else if (activities.daysActive >= 14) score += 15
  else if (activities.daysActive >= 7) score += 10

  return Math.min(100, Math.round(score))
}

// Check if user qualifies for a badge
export function checkBadgeEligibility(
  badgeId: string,
  userStats: {
    paymentCount: number
    familyCount: number
    analyticsViews: number
    consecutiveLogins: number
    teamCollaborations: number
    featuresUsed: number
    dataQualityScore: number
  }
): boolean {
  const badge = BADGES.find(b => b.id === badgeId)
  if (!badge) return false

  switch (badgeId) {
    case 'first_payment':
      return userStats.paymentCount >= 1
    case 'family_master':
      return userStats.familyCount >= 10
    case 'payment_pro':
      return userStats.paymentCount >= 100
    case 'analytics_expert':
      return userStats.analyticsViews >= 50
    case 'early_bird':
      return userStats.consecutiveLogins >= 7
    case 'team_player':
      return userStats.teamCollaborations > 0
    case 'power_user':
      return userStats.featuresUsed >= 5
    case 'data_guardian':
      return userStats.dataQualityScore >= 100
    default:
      return false
  }
}

// Award points for an action
export function getPointsForAction(action: string): number {
  const pointMap: Record<string, number> = {
    'login': 1,
    'create_family': 5,
    'create_payment': 3,
    'create_member': 2,
    'view_analytics': 1,
    'export_data': 2,
    'create_report': 5,
    'complete_task': 2,
    'send_message': 1,
    'upload_document': 2
  }

  return pointMap[action] || 0
}

