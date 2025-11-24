import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * POST /api/users/fix-role
 * Fix user role if it was incorrectly changed to 'family' when user should be admin/super_admin
 * Requires email + password verification for security
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { email, password, newRole } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Check if user has a password (admins have passwords, family users don't)
    // If user has password but role is 'family', they were incorrectly changed
    if (user.role === 'family' && user.password) {
      // Determine correct role based on email or other criteria
      // For now, set to 'admin' if not specified
      const correctRole = newRole || 'admin'
      
      // Validate role
      if (!['super_admin', 'admin'].includes(correctRole)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be admin or super_admin' },
          { status: 400 }
        )
      }

      // Update role
      user.role = correctRole
      // Remove familyId if it was set
      if (user.familyId) {
        user.familyId = undefined
      }
      await user.save()

      // Create new token with correct role
      const token = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email.toLowerCase().trim(),
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      return NextResponse.json({
        success: true,
        message: `Role restored to ${user.role}`,
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
        }
      })
    } else if (user.role === 'family' && !user.password) {
      // User is legitimately a family user (no password)
      return NextResponse.json(
        { error: 'This account is a family account and cannot be changed to admin' },
        { status: 400 }
      )
    } else {
      // User already has correct role
      return NextResponse.json(
        { 
          message: 'Role is already correct',
          role: user.role
        },
        { status: 200 }
      )
    }
  } catch (error: any) {
    console.error('Error fixing user role:', error)
    return NextResponse.json(
      { error: 'Failed to fix role', details: error.message },
      { status: 500 }
    )
  }
}

