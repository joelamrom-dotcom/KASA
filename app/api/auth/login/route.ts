import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Normalize email for lookup
    const normalizedEmail = email.toLowerCase().trim()
    
    console.log('LOGIN ATTEMPT - Input email:', email)
    console.log('LOGIN ATTEMPT - Normalized email:', normalizedEmail)
    
    // Find user by email (exact match, case-insensitive)
    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      console.log('LOGIN FAILED - No user found with email:', normalizedEmail)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    console.log('LOGIN SUCCESS - Found user in DB:')
    console.log('  DB email:', user.email)
    console.log('  DB role:', user.role)
    console.log('  DB userId:', user._id)
    
    // Ensure the user's email in DB matches what was provided (case-insensitive)
    // This prevents issues with stale tokens or email mismatches
    if (user.email.toLowerCase().trim() !== normalizedEmail) {
      console.warn(`Email mismatch in DB: stored email is ${user.email}, but login attempted with ${normalizedEmail}`)
      // Update the email in DB to match the normalized version
      user.email = normalizedEmail
      await user.save()
      console.log('Updated DB email to:', normalizedEmail)
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact support.' },
        { status: 401 }
      )
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // AUTO-FIX: If user has password (admin) but role is 'family', restore admin role
    // This fixes cases where admin role was incorrectly changed when creating a family
    if (user.role === 'family' && user.password) {
      console.log('⚠️ AUTO-FIX: User has password but role is "family" - checking original role')
      
      // Try to determine original role - check if email matches known super_admin emails
      // Or check if user was previously admin/super_admin (check audit logs or other indicators)
      // For now, check if email is a known admin email pattern
      const adminEmails = [
        'joelamrom@gmail.com',
        'yoelamrom@gmail.com',
        // Add other known admin emails here
      ]
      
      const isKnownAdmin = adminEmails.includes(user.email.toLowerCase().trim())
      const restoredRole = isKnownAdmin ? 'super_admin' : 'admin'
      
      console.log(`⚠️ AUTO-FIX: Restoring role to ${restoredRole} (email: ${user.email})`)
      user.role = restoredRole
      
      // Remove familyId if it was incorrectly set
      if (user.familyId) {
        user.familyId = undefined
      }
      await user.save()
      console.log(`✅ AUTO-FIX: Role restored to ${restoredRole}`)
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Normalize email for token (use DB email, normalized)
    const tokenEmail = user.email.toLowerCase().trim()
    console.log('CREATING TOKEN - Using email:', tokenEmail)
    console.log('CREATING TOKEN - Using role:', user.role)
    
    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: tokenEmail, // Use normalized email from DB
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    console.log('TOKEN CREATED - Email in token:', tokenEmail, 'Role:', user.role)

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
      }
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login', details: error.message },
      { status: 500 }
    )
  }
}

