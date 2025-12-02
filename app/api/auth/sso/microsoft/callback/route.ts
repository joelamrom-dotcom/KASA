import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common'

// GET - Handle Microsoft OAuth callback
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const storedState = request.cookies.get('oauth_state')?.value

    if (!state || state !== storedState) {
      return NextResponse.redirect(new URL('/login?error=invalid_state', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }

    // Exchange code for access token
    const redirectUri = `${request.nextUrl.origin}/api/auth/sso/microsoft/callback`
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID || '',
        client_secret: MICROSOFT_CLIENT_SECRET || '',
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'openid email profile',
      }),
    })

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url))
    }

    const tokens = await tokenResponse.json()
    const accessToken = tokens.access_token

    // Get user info from Microsoft
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(new URL('/login?error=failed_to_get_user_info', request.url))
    }

    const microsoftUser = await userInfoResponse.json()

    // Find or create user
    let user = await User.findOne({ email: microsoftUser.mail?.toLowerCase() || microsoftUser.userPrincipalName?.toLowerCase() })
    
    if (!user) {
      user = await User.create({
        email: (microsoftUser.mail || microsoftUser.userPrincipalName).toLowerCase(),
        firstName: microsoftUser.givenName || 'User',
        lastName: microsoftUser.surname || '',
        role: 'admin',
        emailVerified: true,
        isActive: true,
      })
    } else {
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
    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    })
    response.cookies.delete('oauth_state')

    return response
  } catch (error: any) {
    console.error('Error in Microsoft OAuth callback:', error)
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
  }
}

