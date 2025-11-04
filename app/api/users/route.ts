import { NextRequest, NextResponse } from 'next/server'
import db from '../../../lib/database-adapter.js'

// GET - Get users with pagination and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100') // Increased default limit for dashboard
    const search = searchParams.get('search') || ''

    console.log(`API: Fetching users - page: ${page}, limit: ${limit}, search: "${search}"`)
    
    // Add overall timeout to prevent hanging
    const result = await Promise.race([
      db.getUsers(page, limit, search),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 8 seconds')), 8000)
      )
    ]) as any
    
    console.log(`API: Found ${result?.data?.length || 0} users`)
    
    // Ensure we always return an array format
    if (!result || (!result.data && !Array.isArray(result))) {
      console.warn('API: Unexpected result format, returning empty array')
      return NextResponse.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } })
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Get users error:', error)
    console.error('Error stack:', error?.stack)
    
    // Return empty result instead of error for better UX
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to fetch users',
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      },
      { status: 200 } // Return 200 with empty data instead of 500
    )
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, role = 'member', phone, company } = body

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
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
      role,
      phone,
      company
    })

    // Log activity
    await db.logActivity({
      userId: newUser.id,
      type: 'user_created',
      description: `User created: ${firstName} ${lastName}`,
      metadata: {
        userEmail: email,
        userRole: role
      }
    })

    return NextResponse.json({
      message: 'User created successfully',
      user: newUser
    }, { status: 201 })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
