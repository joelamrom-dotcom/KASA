import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { User } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get 2FA status for user
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await User.findById(user.userId).select('twoFactorEnabled twoFactorSecret phoneNumber email')
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Determine method
    let method: 'totp' | 'sms' | 'email' | null = null
    if (dbUser.twoFactorEnabled) {
      if (dbUser.twoFactorSecret) {
        method = 'totp'
      } else if (dbUser.phoneNumber) {
        method = 'sms'
      } else {
        method = 'email'
      }
    }

    return NextResponse.json({
      enabled: dbUser.twoFactorEnabled || false,
      method,
      hasPhone: !!dbUser.phoneNumber,
    })
  } catch (error: any) {
    console.error('Error fetching 2FA status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch 2FA status', details: error.message },
      { status: 500 }
    )
  }
}

