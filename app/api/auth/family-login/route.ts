import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User, Family } from '@/lib/models'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * POST /api/auth/family-login
 * Family login using email and phone number
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { email, phoneNumber } = body

    if (!email || !phoneNumber) {
      return NextResponse.json(
        { error: 'Email and phone number are required' },
        { status: 400 }
      )
    }

    // Normalize email and phone number
    const normalizedEmail = email.toLowerCase().trim()
    const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or phone number' },
        { status: 401 }
      )
    }
    
    // Ensure the user's email in DB matches what was provided (case-insensitive)
    if (user.email.toLowerCase().trim() !== normalizedEmail) {
      user.email = normalizedEmail
      await user.save()
    }

    // Allow family login if:
    // 1. User role is 'family', OR
    // 2. User has a familyId set (admin/super_admin can also be linked to a family)
    if (user.role !== 'family' && !user.familyId) {
      return NextResponse.json(
        { error: 'This login method requires a family account. Please contact support if you need family access.' },
        { status: 403 }
      )
    }
    
    // If user is admin/super_admin but has familyId, allow family login
    // This allows admins to also view their family's data using family login
    if ((user.role === 'admin' || user.role === 'super_admin') && user.familyId) {
      console.log(`ℹ️ Admin ${user.email} logging in as family (familyId: ${user.familyId})`)
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact support.' },
        { status: 401 }
      )
    }

    // Verify phone number matches
    if (!user.phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number not found for this account. Please contact support.' },
        { status: 401 }
      )
    }

    // Normalize stored phone number for comparison
    const normalizedStoredPhone = user.phoneNumber.replace(/[\s\-\(\)]/g, '')

    // Check if phone numbers match (allow partial match - last 4 digits or full match)
    const phoneMatches = 
      normalizedPhone === normalizedStoredPhone ||
      normalizedPhone.slice(-4) === normalizedStoredPhone.slice(-4) ||
      normalizedStoredPhone.slice(-4) === normalizedPhone.slice(-4)

    if (!phoneMatches) {
      return NextResponse.json(
        { error: 'Invalid email or phone number' },
        { status: 401 }
      )
    }

    // Get family information
    let family = null
    if (user.familyId) {
      family = await Family.findById(user.familyId)
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Ensure email in token matches normalized email from DB
    const tokenEmail = user.email.toLowerCase().trim()
    
    // Create JWT token
    // For family login, use 'family' role in token even if user is admin/super_admin
    // This ensures they see the family view, not admin view
    const tokenRole = user.familyId && (user.role === 'admin' || user.role === 'super_admin') 
      ? 'family' 
      : user.role
    
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: tokenEmail, // Use normalized email
        role: tokenRole, // Use 'family' role for family login view
        familyId: user.familyId?.toString(),
        originalRole: user.role, // Store original role for reference
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Return user without password
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
        role: tokenRole, // Return 'family' role for family login view
        originalRole: userObj.role, // Include original role
        isActive: userObj.isActive,
        emailVerified: userObj.emailVerified,
        familyId: userObj.familyId?.toString(),
        familyName: family?.name,
      }
    })
  } catch (error: any) {
    console.error('Family login error:', error)
    return NextResponse.json(
      { error: 'Failed to login', details: error.message },
      { status: 500 }
    )
  }
}

