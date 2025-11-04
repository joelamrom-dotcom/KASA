import { NextRequest, NextResponse } from 'next/server'
import db from '../../../../../lib/database-adapter.js'

// GET - Get all members of a family
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

    // Check if user can access this family
    const canAccess = await db.canUserAccessFamily(userId, params.id)
    if (!canAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const members = await db.getFamilyMembers(params.id)
    
    return NextResponse.json({
      members,
      totalCount: members.length
    })

  } catch (error) {
    console.error('Get family members error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add a user to a family
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
    const { memberUserId, role } = body

    if (!memberUserId || !role) {
      return NextResponse.json(
        { error: 'Member user ID and role are required' },
        { status: 400 }
      )
    }

    // Check if user can manage this family (admin or family_admin)
    const user = await db.getUserById(userId)
    const userFamilies = await db.getUserFamilies(userId)
    const userFamily = userFamilies.find((f: any) => f.id === params.id)
    
    if (!userFamily || (userFamily.role !== 'admin' && userFamily.role !== 'family_admin' && user.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if member user exists
    const memberUser = await db.getUserById(memberUserId)
    if (!memberUser) {
      return NextResponse.json(
        { error: 'Member user not found' },
        { status: 404 }
      )
    }

    // Assign user to family
    const familyRole = await db.assignUserToFamily(memberUserId, params.id, role)

    // Log activity
    await db.logActivity({
      userId: userId,
      type: 'member_added_to_family',
      description: `User ${memberUser.firstName} ${memberUser.lastName} added to family as ${role}`,
      metadata: {
        familyId: params.id,
        memberUserId: memberUserId,
        role: role
      }
    })

    return NextResponse.json({
      message: 'Member added to family successfully',
      familyRole
    }, { status: 201 })

  } catch (error) {
    console.error('Add family member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
