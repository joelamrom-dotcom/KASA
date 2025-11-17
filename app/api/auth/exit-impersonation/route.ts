import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * POST /api/auth/exit-impersonation
 * Exit impersonation and return to admin account
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const currentUser = getAuthenticatedUser(request)
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if currently impersonating (token should have impersonatedBy field)
    // We need to decode the token to check
    let token = request.cookies.get('token')?.value
    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token found' },
        { status: 401 }
      )
    }
    
    // Decode token to check for impersonation
    const decoded = jwt.decode(token) as any
    if (!decoded || !decoded.impersonatedBy) {
      return NextResponse.json(
        { error: 'Not currently impersonating' },
        { status: 400 }
      )
    }
    
    // Find the admin user
    const adminUser = await User.findById(decoded.impersonatedBy)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      )
    }
    
    // Check if admin account is still active
    if (!adminUser.isActive) {
      return NextResponse.json(
        { error: 'Admin account is inactive' },
        { status: 403 }
      )
    }
    
    // Create new token for admin user (without impersonation)
    const newToken = jwt.sign(
      {
        userId: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    // Return admin user data
    const userObj = adminUser.toObject()
    delete userObj.password
    delete userObj.resetPasswordToken
    delete userObj.resetPasswordExpires
    delete userObj.emailVerificationToken
    delete userObj.emailVerificationExpires
    
    return NextResponse.json({
      token: newToken,
      user: {
        id: userObj._id,
        email: userObj.email,
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        role: userObj.role,
        isActive: userObj.isActive,
        emailVerified: userObj.emailVerified,
        profilePicture: userObj.profilePicture,
      }
    })
  } catch (error: any) {
    console.error('Exit impersonation error:', error)
    return NextResponse.json(
      { error: 'Failed to exit impersonation', details: error.message },
      { status: 500 }
    )
  }
}

