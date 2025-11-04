import { NextRequest, NextResponse } from 'next/server'
import db from '../../../../../lib/database-adapter.js'

// GET - Get all children of a user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      )
    }

    // Check if user can access this user's children
    const user = await db.getUserById(userId)
    const targetUser = await db.getUserById(params.id)
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Super admin can see all children, or user can see their own children
    if (user.role !== 'super_admin' && userId !== params.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const children = await db.getChildrenByParent(params.id)
    
    // Calculate age helper
    const calculateAge = (dateOfBirth: string) => {
      if (!dateOfBirth) return 0
      const today = new Date()
      const birthDate = new Date(dateOfBirth)
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    }
    
    // Add age and statement eligibility for each child
    const childrenWithDetails = (Array.isArray(children) ? children : []).map((child: any) => ({
      ...child,
      age: calculateAge(child.dateOfBirth),
      canHaveStatements: true // Simplified - would need proper logic
    }))
    
    return NextResponse.json({
      children: childrenWithDetails,
      totalCount: childrenWithDetails.length
    })

  } catch (error) {
    console.error('Get children error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add a child to a user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, dateOfBirth, gender, email, phone } = body

    if (!firstName || !lastName || !dateOfBirth || !gender) {
      return NextResponse.json(
        { error: 'First name, last name, date of birth, and gender are required' },
        { status: 400 }
      )
    }

    // Check if user can add children to this user
    const user = await db.getUserById(userId)
    const targetUser = await db.getUserById(params.id)
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    // Super admin can add children to anyone, or user can add to themselves
    if (user.role !== 'super_admin' && userId !== params.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create new child (as a member)
    const newChild = await db.createMember({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      phone,
      parentId: params.id,
      userId: params.id
    })

    // Log activity
    await db.logActivity({
      userId: userId,
      type: 'child_created',
      description: `Child ${firstName} ${lastName} added to user ${targetUser.firstName} ${targetUser.lastName}`,
      metadata: {
        childId: newChild.id || newChild._id,
        parentId: params.id,
        childName: `${firstName} ${lastName}`
      }
    })

    // Calculate age helper
    const calculateAge = (dateOfBirth: string) => {
      if (!dateOfBirth) return 0
      const today = new Date()
      const birthDate = new Date(dateOfBirth)
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    }

    return NextResponse.json({
      message: 'Child added successfully',
      child: {
        ...newChild,
        age: calculateAge(newChild.dateOfBirth),
        canHaveStatements: true // Simplified - would need proper logic
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Add child error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
