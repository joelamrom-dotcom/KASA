import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Check for OAuth errors
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent('Google OAuth error: ' + error)}`
      )
    }

    // Verify state (CSRF protection)
    const storedState = request.cookies.get('oauth_state')?.value
    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent('Invalid state parameter. Please try again.')}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent('Authorization code not provided')}`
      )
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent('Google OAuth not configured')}`
      )
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange error:', errorData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent('Failed to exchange authorization code')}`
      )
    }

    const tokens = await tokenResponse.json()
    const accessToken = tokens.access_token

    if (!accessToken) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent('Failed to obtain access token')}`
      )
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent('Failed to fetch user information')}`
      )
    }

    const googleUser = await userInfoResponse.json()
    
    if (!googleUser.email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent('Email not provided by Google')}`
      )
    }

    await connectDB()

    // Get the mode (signup or login) from cookie
    const mode = request.cookies.get('oauth_mode')?.value || 'login'

    // Check if user exists in database
    let user = await User.findOne({ email: googleUser.email.toLowerCase() })

    if (!user) {
      // User doesn't exist
      if (mode === 'login') {
        // Coming from login page - user must sign up first
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/signup?error=${encodeURIComponent('No account found with this email. Please sign up first.')}`
        )
      } else {
        // Coming from signup page - create new user
        const nameParts = (googleUser.name || '').split(' ')
        const firstName = nameParts[0] || googleUser.given_name || 'User'
        const lastName = nameParts.slice(1).join(' ') || googleUser.family_name || ''

        // Ensure firstName and lastName are not empty (required fields)
        const finalFirstName = firstName.trim() || 'User'
        const finalLastName = lastName.trim() || ''

        user = await User.create({
          email: googleUser.email.toLowerCase(),
          firstName: finalFirstName,
          lastName: finalLastName || 'User', // Use 'User' as default if lastName is empty
          password: null, // OAuth users don't have passwords
          role: 'user',
          isActive: true,
          emailVerified: true, // Google emails are verified
          googleId: googleUser.id,
          profilePicture: googleUser.picture,
          lastLogin: new Date(),
        })
      }
    } else {
      // User exists
      if (mode === 'signup') {
        // Coming from signup page but user already exists - redirect to login
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent('An account with this email already exists. Please sign in instead.')}`
        )
      } else {
        // Coming from login page - update existing user and login
        if (!user.googleId) {
          user.googleId = googleUser.id
        }
        if (googleUser.picture && !user.profilePicture) {
          user.profilePicture = googleUser.picture
        }
        user.emailVerified = true
        user.lastLogin = new Date()
        await user.save()
      }
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent('Account is inactive. Please contact support.')}`
      )
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
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

    const userData = {
      id: userObj._id,
      email: userObj.email,
      firstName: userObj.firstName,
      lastName: userObj.lastName,
      role: userObj.role,
      isActive: userObj.isActive,
      emailVerified: userObj.emailVerified,
      profilePicture: userObj.profilePicture,
    }

    // Redirect to success page with token and user data
    const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/google/success`)
    redirectUrl.searchParams.set('token', token)
    redirectUrl.searchParams.set('user', JSON.stringify(userData))

    const response = NextResponse.redirect(redirectUrl.toString())
    
    // Clear OAuth state and mode cookies
    response.cookies.delete('oauth_state')
    response.cookies.delete('oauth_mode')
    
    // Set session cookie
    const isProduction = process.env.NODE_ENV === 'production'
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response
  } catch (error: any) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent('Authentication failed: ' + error.message)}`
    )
  }
}

