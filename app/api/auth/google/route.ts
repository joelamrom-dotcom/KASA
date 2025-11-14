import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID in environment variables.' },
        { status: 500 }
      )
    }

    // Get mode from query parameter (signup or login)
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get('mode') || 'login' // Default to 'login' if not specified

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex')
    
    // Store state in cookie (httpOnly, secure in production)
    const isProduction = process.env.NODE_ENV === 'production'
    const response = NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `state=${state}&` +
      `access_type=offline&` +
      `prompt=consent`
    )
    
    // Set state cookie
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    })
    
    // Store mode in cookie to know if this is signup or login
    response.cookies.set('oauth_mode', mode, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    })
    
    return response
  } catch (error: any) {
    console.error('Google OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth', details: error.message },
      { status: 500 }
    )
  }
}

