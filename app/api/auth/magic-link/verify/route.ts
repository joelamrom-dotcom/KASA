import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// GET - Verify magic link token and login
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (!token || !email) {
      return NextResponse.redirect(new URL('/login?error=invalid_link', request.url))
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return NextResponse.redirect(new URL('/login?error=user_not_found', request.url))
    }

    // Verify token
    if (!user.resetPasswordToken || user.resetPasswordToken !== token) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    // Check expiration
    if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
      return NextResponse.redirect(new URL('/login?error=token_expired', request.url))
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.redirect(new URL('/login?error=account_inactive', request.url))
    }

    // Clear token
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    user.lastLogin = new Date()
    await user.save()

    // Generate JWT token
    const jwtToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        familyId: user.familyId?.toString(),
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Redirect to dashboard with token
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('token', jwtToken)
    
    const response = NextResponse.redirect(redirectUrl)
    
    // Set cookie
    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error: any) {
    console.error('Error verifying magic link:', error)
    return NextResponse.redirect(new URL('/login?error=verification_failed', request.url))
  }
}

