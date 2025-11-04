import { NextRequest, NextResponse } from 'next/server'
import db from '../../../../../lib/database-adapter.js'

// Helper function to make HTTPS requests with better error handling
async function httpsRequest(url: string, options: any = {}) {
  return new Promise((resolve, reject) => {
    const https = require('https')
    const { URL } = require('url')
    const urlObj = new URL(url)
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      // Allow self-signed certificates in development
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    }

    const req = https.request(requestOptions, (res: any) => {
      let data = ''
      res.on('data', (chunk: Buffer) => {
        data += chunk.toString()
      })
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: async () => JSON.parse(data),
          text: async () => data,
        })
      })
    })

    req.on('error', (error: Error) => {
      reject(error)
    })

    if (options.body) {
      req.write(options.body)
    }

    req.end()
  })
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Check for OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Google authentication was cancelled or failed')}`, request.url)
      )
    }

    // Validate state parameter (CSRF protection)
    const storedState = request.cookies.get('oauth_state')?.value
    if (!state || state !== storedState) {
      return NextResponse.redirect(
        new URL('/login?error=' + encodeURIComponent('Invalid state parameter'), request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/login?error=' + encodeURIComponent('Authorization code not provided'), request.url)
      )
    }

    // Exchange authorization code for access token
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/login?error=' + encodeURIComponent('Google OAuth not configured'), request.url)
      )
    }

    // Exchange code for tokens
    let tokenResponse
    const tokenRequestBody = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString()

    try {
      // Try native fetch first
      try {
        tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: tokenRequestBody,
        })
      } catch (fetchError) {
        console.log('Native fetch failed, trying https module...', fetchError instanceof Error ? fetchError.message : 'Unknown error')
        // Fallback to https module
        tokenResponse = await httpsRequest('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: tokenRequestBody,
        })
      }
    } catch (fetchError) {
      console.error('Fetch error during token exchange:', fetchError)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to Google'}`)}`, baseUrl)
      )
    }

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: errorData,
      })
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(`Failed to exchange authorization code: ${errorData}`)}`, baseUrl)
      )
    }

    const tokens = await tokenResponse.json()
    const accessToken = tokens.access_token

    // Get user info from Google
    let userInfoResponse
    try {
      try {
        userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      } catch (fetchError) {
        console.log('Native fetch failed for userinfo, trying https module...', fetchError instanceof Error ? fetchError.message : 'Unknown error')
        // Fallback to https module
        userInfoResponse = await httpsRequest('https://www.googleapis.com/oauth2/v2/userinfo', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      }
    } catch (fetchError) {
      console.error('Fetch error during user info retrieval:', fetchError)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to fetch user info'}`)}`, baseUrl)
      )
    }

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.text()
      console.error('User info fetch error:', {
        status: userInfoResponse.status,
        statusText: userInfoResponse.statusText,
        body: errorData,
      })
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Failed to fetch user information')}`, baseUrl)
      )
    }

    const googleUser = await userInfoResponse.json()
    
    // Extract user information
    const email = googleUser.email
    const firstName = googleUser.given_name || googleUser.name?.split(' ')[0] || 'User'
    const lastName = googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || ''
    const picture = googleUser.picture

    if (!email) {
      return NextResponse.redirect(
        new URL('/login?error=' + encodeURIComponent('Email not provided by Google'), request.url)
      )
    }

    // Check if user exists
    let user = await db.getUserByEmail(email)

    if (!user) {
      // Create new user
      user = await db.createUser({
        firstName,
        lastName,
        email,
        password: null, // No password for OAuth users
        role: 'member',
        provider: 'google',
        googleId: googleUser.id,
        picture: picture,
      })

      // Log activity
      await db.logActivity({
        userId: user.id || user._id,
        type: 'user_registered',
        description: `User registered via Google: ${firstName} ${lastName}`,
        metadata: {
          userEmail: email,
          provider: 'google',
        },
      })
    } else {
      // Update existing user with Google info if needed
      if (!user.googleId) {
        await db.updateUser(user.id || user._id, {
          googleId: googleUser.id,
          picture: picture,
          provider: 'google',
        })
      }
    }

    // Create session
    const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
    await db.createSession({
      sessionToken,
      userId: user.id || user._id,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    })

    // Log activity
    await db.logActivity({
      userId: user.id || user._id,
      type: 'user_login',
      description: `User logged in via Google: ${firstName} ${lastName}`,
      metadata: {
        userEmail: email,
        provider: 'google',
        sessionToken: sessionToken,
      },
    })

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user

    // Create a page that stores user data and redirects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const redirectUrl = new URL('/auth/google/success', baseUrl)
    redirectUrl.searchParams.set('token', sessionToken)
    redirectUrl.searchParams.set('user', JSON.stringify(userWithoutPassword))

    const response = NextResponse.redirect(redirectUrl.toString())
    
    // Clear OAuth state cookie
    response.cookies.delete('oauth_state')

    return response
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(`Authentication failed: ${errorMessage}`)}`, baseUrl)
    )
  }
}

