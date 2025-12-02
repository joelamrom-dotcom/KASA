import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { User } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Check onboarding status
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ completed: false })
    }

    const dbUser = await User.findById(user.userId).select('onboardingCompleted')
    
    return NextResponse.json({
      completed: dbUser?.onboardingCompleted || false
    })
  } catch (error: any) {
    console.error('Error checking onboarding status:', error)
    return NextResponse.json({ completed: false })
  }
}

