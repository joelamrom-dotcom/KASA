import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common'

// GET - Initiate Microsoft OAuth
export async function GET(request: NextRequest) {
  try {
    const redirectUri = `${request.nextUrl.origin}/api/auth/sso/microsoft/callback`
    const scope = 'openid email profile'
    const state = crypto.randomBytes(16).toString('hex')

    const authUrl = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?` +
      `client_id=${MICROSOFT_CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_mode=query&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}`

    const response = NextResponse.redirect(authUrl)
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    })

    return response
  } catch (error: any) {
    console.error('Error initiating Microsoft OAuth:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth', details: error.message },
      { status: 500 }
    )
  }
}

