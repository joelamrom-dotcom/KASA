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
    
    // First, check if joelamrom@gmail.com or yoelamrom@gmail.com exists and is super_admin (special case)
    // Check both variations in case of typo
    const joelamromUser = await User.findOne({ 
      $or: [
        { email: 'joelamrom@gmail.com' },
        { email: 'yoelamrom@gmail.com' }
      ]
    })
    
    if (joelamromUser) {
      console.log('GET /api/users - Found joelamrom/yoelamrom in DB. Email:', joelamromUser.email, 'Role:', joelamromUser.role)
      
      // Check if current user matches (by email or userId)
      const userEmailLower = user.email?.toLowerCase().trim()
      const dbEmailLower = joelamromUser.email?.toLowerCase().trim()
      const isJoelamrom = 
        (userEmailLower === 'joelamrom@gmail.com' || userEmailLower === 'yoelamrom@gmail.com') ||
        (dbEmailLower === 'joelamrom@gmail.com' || dbEmailLower === 'yoelamrom@gmail.com') ||
        (user.userId && user.userId === joelamromUser._id.toString())
      
      if (isJoelamrom && joelamromUser.role === 'super_admin') {
        console.log('GET /api/users - ✅ Current user matches joelamrom/yoelamrom with super_admin role - GRANTING ACCESS')
        hasSuperAdminAccess = true
        dbUser = joelamromUser
      }
    }
    
    // If not joelamrom, try to find current user in DB by userId first (most reliable)
    if (!hasSuperAdminAccess && user.userId) {
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
    
    // If not found by userId, try by email
    if (!hasSuperAdminAccess && !dbUser && user.email) {
      try {
        dbUser = await User.findOne({ email: user.email.toLowerCase().trim() })
        if (dbUser) {
          console.log('GET /api/users - Found user by email:', dbUser.email, 'DB role:', dbUser.role)
          if (dbUser.role === 'super_admin') {
            console.log('GET /api/users - ✅ DB confirms super_admin role - GRANTING ACCESS')
            hasSuperAdminAccess = true
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

