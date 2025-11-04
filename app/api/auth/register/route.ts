import { NextRequest, NextResponse } from 'next/server'
import db from '../../../../lib/database-adapter.js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password, role = 'member' } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'First name, last name, email, and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create new user
    const newUser = await db.createUser({
      firstName,
      lastName,
      email,
      password, // In production, hash this password
      role
    })

    // Log activity
    await db.logActivity({
      userId: newUser.id,
      type: 'user_registered',
      description: `User registered: ${firstName} ${lastName}`,
      metadata: {
        userEmail: email,
        userRole: role
      }
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      message: 'User registered successfully',
      user: userWithoutPassword
    }, { status: 201 })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
