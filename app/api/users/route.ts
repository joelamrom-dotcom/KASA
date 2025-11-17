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
    
    // Special handling for joelamrom@gmail.com - always check DB role
    let hasSuperAdminAccess = isSuperAdmin(user)
    if (user.email === 'joelamrom@gmail.com' && !hasSuperAdminAccess) {
      console.log('GET /api/users - Checking DB role for joelamrom@gmail.com')
      const dbUser = await User.findOne({ email: 'joelamrom@gmail.com' })
      if (dbUser && dbUser.role === 'super_admin') {
        console.log('GET /api/users - DB confirms super_admin role for joelamrom@gmail.com')
        hasSuperAdminAccess = true
      }
    }
    
    // Only super_admin can see all users
    if (!hasSuperAdminAccess) {
      console.log('GET /api/users - Access denied. User role:', user.role, 'Email:', user.email)
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }
    
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

