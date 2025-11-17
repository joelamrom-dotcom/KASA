import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import jwt from 'jsonwebtoken'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * Refresh user session - get updated user info from database
 * This is useful when user's role or other info has been updated
 */
export async function POST(request: NextRequest) {
  console.log('POST /api/auth/refresh-user - Request received')
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

    console.log('Refreshing user session for:', currentUser.email, 'Current role in token:', currentUser.role)

    // Try to find user by userId first (most reliable)
    let user = null
    if (currentUser.userId) {
      user = await User.findById(currentUser.userId)
      console.log('User lookup by userId:', currentUser.userId, user ? 'Found' : 'Not found')
    }
    
    // If not found by userId, try by email (normalized)
    if (!user && currentUser.email) {
      const normalizedEmail = currentUser.email.toLowerCase().trim()
      user = await User.findOne({ email: normalizedEmail })
      console.log('User lookup by email:', normalizedEmail, user ? 'Found' : 'Not found')
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please log out and log back in.' },
        { status: 404 }
      )
    }

    console.log('User found in DB:', user.email, 'Role in DB:', user.role)

    // Normalize email for token (ensure consistency)
    const normalizedEmail = user.email.toLowerCase().trim()

    // Create new JWT token with updated role and normalized email
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: normalizedEmail, // Use normalized email
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

    // Create response with token in both JSON and cookie
    const response = NextResponse.json({
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

    // Set cookie with new token
    response.cookies.set('token', token, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response
  } catch (error: any) {
    console.error('Refresh user error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh user', details: error.message },
      { status: 500 }
    )
  }
}

