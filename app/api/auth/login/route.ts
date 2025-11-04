import { NextRequest, NextResponse } from 'next/server'
import db from '../../../../lib/database-adapter.js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get user by email
    const user = await db.getUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check password (in production, use bcrypt.compare)
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create session
    const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const session = await db.createSession({
      sessionToken,
      userId: user.id,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    })

    // Log activity
    await db.logActivity({
      userId: user.id,
      type: 'user_login',
      description: `User logged in: ${user.firstName} ${user.lastName}`,
      metadata: {
        userEmail: email,
        sessionToken: sessionToken
      }
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      sessionToken: sessionToken
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
