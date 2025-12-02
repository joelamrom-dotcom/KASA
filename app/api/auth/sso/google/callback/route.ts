import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

// GET - Handle Google OAuth callback
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const storedState = request.cookies.get('oauth_state')?.value

    // Verify state (CSRF protection)
    if (!state || state !== storedState) {
      return NextResponse.redirect(new URL('/login?error=invalid_state', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }

    // Exchange code for access token
    const redirectUri = `${request.nextUrl.origin}/api/auth/sso/google/callback`
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID || '',
        client_secret: GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url))
    }

    const tokens = await tokenResponse.json()
    const accessToken = tokens.access_token

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(new URL('/login?error=failed_to_get_user_info', request.url))
    }

    const googleUser = await userInfoResponse.json()

    // Find or create user
    let user = await User.findOne({ email: googleUser.email.toLowerCase() })
    
    if (!user) {
      // Create new user
      user = await User.create({
        email: googleUser.email.toLowerCase(),
        firstName: googleUser.given_name || 'User',
        lastName: googleUser.family_name || '',
        role: 'admin',
        googleId: googleUser.id,
        profilePicture: googleUser.picture,
        emailVerified: true,
        isActive: true,
      })
    } else {
      // Update existing user
      user.googleId = googleUser.id
      user.profilePicture = googleUser.picture
      user.emailVerified = true
      user.lastLogin = new Date()
      await user.save()
    }

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

    // Redirect to dashboard
    const response = NextResponse.redirect(new URL('/', request.url))
    
    // Set cookie and clear OAuth state
    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })
    response.cookies.delete('oauth_state')

    return response
  } catch (error: any) {
    console.error('Error in Google OAuth callback:', error)
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
  }
}

