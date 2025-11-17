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

    // Normalize phone number (remove spaces, dashes, parentheses)
    const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or phone number' },
        { status: 401 }
      )
    }

    // Check if user is a family user
    if (user.role !== 'family') {
      return NextResponse.json(
        { error: 'This login method is only for family accounts' },
        { status: 403 }
      )
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

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        familyId: user.familyId?.toString(),
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
        role: userObj.role,
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

