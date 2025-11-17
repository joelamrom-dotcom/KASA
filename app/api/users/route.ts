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
    
    console.log('GET /api/users - ========== START ROLE CHECK ==========')
    console.log('GET /api/users - Token info - userId:', user.userId, 'email:', user.email, 'role:', user.role)
    
    // Try to find current user in DB by userId first (most reliable)
    if (user.userId) {
      try {
        console.log('GET /api/users - Looking up user by userId:', user.userId)
        dbUser = await User.findById(user.userId)
        if (dbUser) {
          console.log('GET /api/users - ✅ Found user by userId')
          console.log('GET /api/users -   DB email:', dbUser.email)
          console.log('GET /api/users -   DB role:', dbUser.role)
          console.log('GET /api/users -   DB role type:', typeof dbUser.role)
          console.log('GET /api/users -   Is super_admin?', dbUser.role === 'super_admin')
          if (dbUser.role === 'super_admin') {
            console.log('GET /api/users - ✅✅✅ DB confirms super_admin role - GRANTING ACCESS')
            hasSuperAdminAccess = true
          } else {
            console.log('GET /api/users - ❌ DB role is NOT super_admin, it is:', dbUser.role)
          }
        } else {
          console.log('GET /api/users - ❌ User not found by userId')
        }
      } catch (err: any) {
        console.log('GET /api/users - ❌ Error finding user by userId:', err?.message || err)
      }
    } else {
      console.log('GET /api/users - ⚠️ No userId in token')
    }
    
    // If not found by userId, try by email
    if (!hasSuperAdminAccess && !dbUser && user.email) {
      try {
        const userEmailLower = user.email.toLowerCase().trim()
        console.log('GET /api/users - Looking up user by email:', userEmailLower)
        dbUser = await User.findOne({ email: userEmailLower })
        if (dbUser) {
          console.log('GET /api/users - ✅ Found user by email')
          console.log('GET /api/users -   DB email:', dbUser.email)
          console.log('GET /api/users -   DB role:', dbUser.role)
          console.log('GET /api/users -   DB role type:', typeof dbUser.role)
          console.log('GET /api/users -   Is super_admin?', dbUser.role === 'super_admin')
          if (dbUser.role === 'super_admin') {
            console.log('GET /api/users - ✅✅✅ DB confirms super_admin role - GRANTING ACCESS')
            hasSuperAdminAccess = true
          } else {
            console.log('GET /api/users - ❌ DB role is NOT super_admin, it is:', dbUser.role)
          }
        } else {
          console.log('GET /api/users - ❌ User not found by email:', userEmailLower)
        }
      } catch (err: any) {
        console.log('GET /api/users - ❌ Error finding user by email:', err?.message || err)
      }
    }
    
    // Fallback to token role if DB lookup failed
    if (!hasSuperAdminAccess && !dbUser) {
      console.log('GET /api/users - ⚠️ User not found in DB, checking token role:', user.role)
      hasSuperAdminAccess = isSuperAdmin(user)
      console.log('GET /api/users - Token-based super_admin check:', hasSuperAdminAccess)
    }
    
    console.log('GET /api/users - ========== END ROLE CHECK ==========')
    console.log('GET /api/users - Final decision - hasSuperAdminAccess:', hasSuperAdminAccess)
    
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

