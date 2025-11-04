import { NextRequest, NextResponse } from 'next/server'
import db from '../../../../../lib/database-adapter.js'

// POST - Promote a child to a user
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
    const { reason } = body // 'married', 'age_13_male', 'other'

    // Check if user can promote this child
    const user = await db.getUserById(userId)
    const children = await db.getChildrenByParent(userId)
    const child = children.find((c: any) => c.id === params.id)
    
    if (!child) {
      return NextResponse.json(
        { error: 'Child not found or access denied' },
        { status: 404 }
      )
    }

    // Only super admin or the child's parent can promote
    if (user.role !== 'super_admin' && child.parentId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if child is already a user
    if (child.status === 'user') {
      return NextResponse.json(
        { error: 'Child is already promoted to user' },
        { status: 400 }
      )
    }

    // For age 13+ male children, check if they can have statements
    if (reason === 'age_13_male') {
      const canHaveStatements = await db.canChildHaveStatements(child.id)
      if (!canHaveStatements) {
        return NextResponse.json(
          { error: 'Child does not meet criteria for statement creation (must be 13+ and male)' },
          { status: 400 }
        )
      }
    }

    // Promote child to user
    const newUser = await db.promoteChildToUser(child.id)

    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to promote child to user' },
        { status: 500 }
      )
    }

    // Log activity
    await db.logActivity({
      userId: userId,
      type: 'child_promoted_to_user',
      description: `Child ${child.firstName} ${child.lastName} promoted to user (reason: ${reason})`,
      metadata: {
        childId: child.id,
        newUserId: newUser.id,
        reason: reason,
        childName: `${child.firstName} ${child.lastName}`
      }
    })

    return NextResponse.json({
      message: 'Child promoted to user successfully',
      newUser
    })

  } catch (error) {
    console.error('Promote child error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
