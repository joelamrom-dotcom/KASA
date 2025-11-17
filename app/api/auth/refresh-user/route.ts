import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import jwt from 'jsonwebtoken'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * Refresh user session - get updated user info from database
 * This is useful when user's role or other info has been updated
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get current authenticated user from token
    const currentUser = getAuthenticatedUser(request)
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch fresh user data from database using the email from token (more reliable)
    const user = await User.findOne({ email: currentUser.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create new JWT token with updated role
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        familyId: user.familyId?.toString()
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Return updated user without password
    const userObj = user.toObject()
    delete userObj.password
    delete userObj.resetPasswordToken
    delete userObj.resetPasswordExpires
    delete userObj.emailVerificationToken
    delete userObj.emailVerificationExpires

    return NextResponse.json({
      token,
      user: {
        id: userObj._id,
        email: userObj.email,
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        role: userObj.role,
        isActive: userObj.isActive,
        emailVerified: userObj.emailVerified,
        familyId: userObj.familyId?.toString()
      }
    })
  } catch (error: any) {
    console.error('Refresh user error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh user', details: error.message },
      { status: 500 }
    )
  }
}

