import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

/**
 * POST /api/users/invite
 * Invite a new team member
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.USERS_CREATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const data = await request.json()
    const { email, firstName, lastName, role, customRoleId } = data
    
    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }
    
    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')
    const invitationExpires = new Date()
    invitationExpires.setDate(invitationExpires.getDate() + 7) // Expires in 7 days
    
    // Create user with invitation
    const newUser = await User.create({
      email: email.toLowerCase(),
      firstName,
      lastName,
      role,
      customRoleId: customRoleId || undefined,
      isActive: false, // Inactive until they accept invitation
      emailVerified: false,
      invitationToken,
      invitationExpires,
      invitedBy: user.userId,
    })
    
    await auditLogFromRequest(request, user, 'create', 'user', {
      entityId: newUser._id.toString(),
      entityName: `${firstName} ${lastName}`,
      description: `Invited user: ${email}`,
      metadata: { role, invitationToken },
    })
    
    // TODO: Send invitation email with token
    // For now, return the invitation link
    const invitationLink = `${request.nextUrl.origin}/accept-invitation?token=${invitationToken}`
    
    return NextResponse.json({
      user: {
        _id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        invitationToken,
        invitationLink,
        invitationExpires: newUser.invitationExpires,
      },
      message: 'User invited successfully',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error inviting user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to invite user' },
      { status: 500 }
    )
  }
}

