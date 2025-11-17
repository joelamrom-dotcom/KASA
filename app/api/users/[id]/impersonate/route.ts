import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import { getAuthenticatedUser, isSuperAdmin } from '@/lib/middleware'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * POST /api/users/[id]/impersonate
 * Impersonate a user (super_admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const adminUser = getAuthenticatedUser(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // ALWAYS check DB for current user's role (bypass stale token)
    let hasSuperAdminAccess = false
    let dbUser = null
    
    // Try to find current user in DB by userId first (most reliable)
    if (adminUser.userId) {
      try {
        dbUser = await User.findById(adminUser.userId)
        if (dbUser && dbUser.role === 'super_admin') {
          hasSuperAdminAccess = true
        }
      } catch (err) {
        // Continue to email lookup
      }
    }
    
    // If not found by userId, try by email
    if (!hasSuperAdminAccess && !dbUser && adminUser.email) {
      try {
        const userEmailLower = adminUser.email.toLowerCase().trim()
        dbUser = await User.findOne({ email: userEmailLower })
        if (dbUser && dbUser.role === 'super_admin') {
          hasSuperAdminAccess = true
        }
      } catch (err) {
        // Continue to fallback
      }
    }
    
    // Fallback to token role if DB lookup failed
    if (!hasSuperAdminAccess && !dbUser) {
      hasSuperAdminAccess = isSuperAdmin(adminUser)
    }
    
    // Only super_admin can impersonate users
    if (!hasSuperAdminAccess) {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }
    
    // Prevent impersonating yourself
    if (adminUser.userId === params.id) {
      return NextResponse.json(
        { error: 'Cannot impersonate yourself' },
        { status: 400 }
      )
    }
    
    // Find target user
    const targetUser = await User.findById(params.id)
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Check if target user is active
    if (!targetUser.isActive) {
      return NextResponse.json(
        { error: 'Cannot impersonate inactive user' },
        { status: 400 }
      )
    }
    
    // Create JWT token for target user with impersonation info
    const token = jwt.sign(
      {
        userId: targetUser._id.toString(),
        email: targetUser.email,
        role: targetUser.role,
        impersonatedBy: adminUser.userId, // Track who is impersonating
        impersonatedByEmail: adminUser.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    // Return user without password
    const userObj = targetUser.toObject()
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
        profilePicture: userObj.profilePicture,
      },
      impersonatedBy: {
        id: adminUser.userId,
        email: adminUser.email,
      }
    })
  } catch (error: any) {
    console.error('Impersonation error:', error)
    return NextResponse.json(
      { error: 'Failed to impersonate user', details: error.message },
      { status: 500 }
    )
  }
}

