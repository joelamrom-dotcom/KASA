import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import { getAuthenticatedUser, isSuperAdmin } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users
 * Get all users (super_admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    console.log('GET /api/users - User from token:', user?.email, 'Role:', user?.role)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // ALWAYS check DB for current user's role (bypass stale token)
    let hasSuperAdminAccess = false
    let dbUser = null
    
    console.log('GET /api/users - Token info - userId:', user.userId, 'email:', user.email, 'role:', user.role)
    
    // Try to find current user in DB by userId first (most reliable)
    if (user.userId) {
      try {
        dbUser = await User.findById(user.userId)
        if (dbUser) {
          console.log('GET /api/users - Found user by userId:', dbUser.email, 'DB role:', dbUser.role)
          if (dbUser.role === 'super_admin') {
            console.log('GET /api/users - ✅ DB confirms super_admin role - GRANTING ACCESS')
            hasSuperAdminAccess = true
          }
        }
      } catch (err) {
        console.log('GET /api/users - Error finding user by userId:', err)
      }
    }
    
    // If not found by userId, try by email (handles both joelamrom and yoelamrom)
    if (!hasSuperAdminAccess && !dbUser && user.email) {
      try {
        const userEmailLower = user.email.toLowerCase().trim()
        dbUser = await User.findOne({ email: userEmailLower })
        if (dbUser) {
          console.log('GET /api/users - Found user by email:', dbUser.email, 'DB role:', dbUser.role)
          if (dbUser.role === 'super_admin') {
            console.log('GET /api/users - ✅ DB confirms super_admin role - GRANTING ACCESS')
            hasSuperAdminAccess = true
          }
        } else {
          // Also check for joelamrom/yoelamrom variations (in case of typo)
          const alternateEmail = userEmailLower === 'joelamrom@gmail.com' 
            ? 'yoelamrom@gmail.com' 
            : userEmailLower === 'yoelamrom@gmail.com' 
            ? 'joelamrom@gmail.com' 
            : null
          
          if (alternateEmail) {
            dbUser = await User.findOne({ email: alternateEmail })
            if (dbUser && dbUser.role === 'super_admin') {
              console.log('GET /api/users - ✅ Found alternate email with super_admin role - GRANTING ACCESS')
              hasSuperAdminAccess = true
            }
          }
        }
      } catch (err) {
        console.log('GET /api/users - Error finding user by email:', err)
      }
    }
    
    // Fallback to token role if DB lookup failed
    if (!hasSuperAdminAccess && !dbUser) {
      console.log('GET /api/users - ⚠️ User not found in DB, checking token role:', user.role)
      hasSuperAdminAccess = isSuperAdmin(user)
    }
    
    // Only super_admin can see all users
    if (!hasSuperAdminAccess) {
      console.log('GET /api/users - Access denied. Token role:', user.role, 'Email:', user.email, 'HasSuperAdminAccess:', hasSuperAdminAccess)
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }
    
    console.log('GET /api/users - ✅ Access granted, fetching all users')
    
    // Get all users, excluding passwords
    const users = await User.find({})
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires')
      .sort({ createdAt: -1 })
      .lean()
    
    return NextResponse.json(users)
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    )
  }
}

