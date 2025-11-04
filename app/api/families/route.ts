import { NextRequest, NextResponse } from 'next/server'
import db from '../../../lib/database-adapter.js'

// GET - Get accessible families for the user (role-based)
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id')
    console.log('Families API - Received user-id header:', userId)
    
    if (!userId) {
      console.log('Families API - No user-id header provided')
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      )
    }

    let user = await db.getUserById(userId)
    console.log('Families API - User lookup result:', user ? 'Found' : 'Not found', userId)
    
    // If user not found by ID, try multiple fallback strategies
    if (!user) {
      console.log('Families API - User not found by ID, trying alternative lookup')
      
      // Strategy 1: Try to find by id or _id in all users
      const allUsers = await db.getAllUsers()
      console.log('Families API - Total users in database:', allUsers.length)
      if (allUsers.length > 0) {
        console.log('Families API - Sample user IDs:', allUsers.slice(0, 3).map((u: any) => ({ id: u.id, _id: u._id, email: u.email })))
      }
      
      // Try to find by id or _id with multiple matching strategies
      user = allUsers.find((u: any) => {
        const matches = 
          u.id === userId || 
          u._id === userId || 
          u.id?.toString() === userId || 
          u._id?.toString() === userId ||
          (u.id && u.id.toString() === userId.toString()) ||
          (u._id && u._id.toString() === userId.toString())
        return matches
      })
      
      // Strategy 2: If still not found, try to get user from email if available in headers
      if (!user) {
        const userEmail = request.headers.get('user-email')
        if (userEmail) {
          console.log('Families API - Trying to find user by email:', userEmail)
          user = await db.getUserByEmail(userEmail)
          if (user) {
            console.log('Families API - User found by email:', { id: user.id, _id: user._id, email: user.email })
          }
        }
      }
      
      if (!user) {
        console.log('Families API - User still not found after all fallback strategies')
        console.log('Families API - Looking for userId:', userId)
        console.log('Families API - Available user IDs:', allUsers.slice(0, 10).map((u: any) => ({ id: u.id, _id: u._id, email: u.email })))
        return NextResponse.json(
          { error: 'User not found', debug: { userId, totalUsers: allUsers.length, availableIds: allUsers.slice(0, 5).map((u: any) => ({ id: u.id, _id: u._id })) } },
          { status: 401 }
        )
      }
      console.log('Families API - User found via fallback lookup:', { id: user.id, _id: user._id, email: user.email })
    }

    let families;
    
    // Super admin can see all families
    if (user.role === 'super_admin') {
      families = await db.getFamilies();
    } else {
      // Regular users can only see families they belong to
      families = await db.getUserFamilies(userId);
    }

    return NextResponse.json({
      families,
      totalCount: families.length,
      userRole: user.role
    })

  } catch (error) {
    console.error('Get families error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new family
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, phone, email, userId } = body

    // Validate required fields
    if (!name || !userId) {
      return NextResponse.json(
        { error: 'Family name and user ID are required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.getUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create new family
    const newFamily = await db.createFamily({
      name,
      address,
      phone,
      email,
      createdBy: userId
    })

    // Assign user as family admin
    await db.assignUserToFamily(userId, newFamily.id, 'admin')

    // Log activity
    await db.logActivity({
      userId: userId,
      type: 'family_created',
      description: `Family created: ${name}`,
      metadata: {
        familyId: newFamily.id,
        familyName: name
      }
    })

    return NextResponse.json({
      message: 'Family created successfully',
      family: newFamily
    }, { status: 201 })

  } catch (error) {
    console.error('Create family error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
