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
    
    // Special handling for joelamrom@gmail.com - ALWAYS check DB role (bypass token)
    let hasSuperAdminAccess = isSuperAdmin(user)
    const emailLower = user.email?.toLowerCase()?.trim()
    
    // ALWAYS check DB for joelamrom@gmail.com - check by email first, then by userId
    let dbUser = null
    
    // First, try to find joelamrom@gmail.com by email
    dbUser = await User.findOne({ email: 'joelamrom@gmail.com' })
    
    // If found and it matches the current user (by email or userId), check role
    if (dbUser) {
      const dbEmailLower = dbUser.email?.toLowerCase()?.trim()
      const isCurrentUser = emailLower === 'joelamrom@gmail.com' || 
                           (user.userId && user.userId === dbUser._id.toString())
      
      if (isCurrentUser) {
        console.log('GET /api/users - Found joelamrom@gmail.com in DB. DB role:', dbUser.role, 'Token role:', user.role)
        if (dbUser.role === 'super_admin') {
          console.log('GET /api/users - ✅ DB confirms super_admin role for joelamrom@gmail.com - GRANTING ACCESS')
          hasSuperAdminAccess = true
        } else {
          console.log('GET /api/users - ❌ DB role is not super_admin:', dbUser.role)
        }
      }
    } else {
      // If not found by email, try by userId as fallback
      if (user.userId) {
        dbUser = await User.findById(user.userId)
        if (dbUser) {
          const dbEmailLower = dbUser.email?.toLowerCase()?.trim()
          if (dbEmailLower === 'joelamrom@gmail.com' && dbUser.role === 'super_admin') {
            console.log('GET /api/users - ✅ Found joelamrom@gmail.com by userId, DB confirms super_admin - GRANTING ACCESS')
            hasSuperAdminAccess = true
          }
        }
      }
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

