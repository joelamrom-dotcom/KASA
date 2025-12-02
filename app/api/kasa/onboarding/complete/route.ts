import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { User } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - Mark onboarding as complete
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await User.findById(user.userId)
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Mark onboarding as complete
    dbUser.onboardingCompleted = true
    dbUser.onboardingCompletedAt = new Date()
    await dbUser.save()

    return NextResponse.json({ message: 'Onboarding completed' })
  } catch (error: any) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding', details: error.message },
      { status: 500 }
    )
  }
}

