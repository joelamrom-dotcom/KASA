import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { User } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - Save onboarding data
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const dbUser = await User.findById(user.userId)
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user preferences
    if (body.firstName) dbUser.firstName = body.firstName
    if (body.lastName) dbUser.lastName = body.lastName
    if (body.timezone) dbUser.timezone = body.timezone
    if (body.language) dbUser.language = body.language
    if (body.theme) dbUser.theme = body.theme
    if (body.notifications !== undefined) dbUser.notifications = body.notifications

    await dbUser.save()

    return NextResponse.json({ message: 'Onboarding data saved' })
  } catch (error: any) {
    console.error('Error saving onboarding data:', error)
    return NextResponse.json(
      { error: 'Failed to save onboarding data', details: error.message },
      { status: 500 }
    )
  }
}

