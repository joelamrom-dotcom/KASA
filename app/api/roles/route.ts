import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Role, Permission } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

/**
 * GET /api/roles
 * Get all roles (requires roles.view permission)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.ROLES_VIEW))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const roles = await Role.find()
      .populate('permissions', 'name displayName module action')
      .populate('createdBy', 'email firstName lastName')
      .populate('updatedBy', 'email firstName lastName')
      .sort({ isSystem: -1, createdAt: -1 })
      .lean()
    
    return NextResponse.json({ roles })
  } catch (error: any) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/roles
 * Create a new role (requires roles.create permission)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.ROLES_CREATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const data = await request.json()
    const { name, displayName, description, permissions: permissionIds, isDefault } = data
    
    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check if role already exists
    const existing = await Role.findOne({ name })
    if (existing) {
      return NextResponse.json(
        { error: 'Role already exists' },
        { status: 400 }
      )
    }
    
    // Validate permissions exist
    if (permissionIds && permissionIds.length > 0) {
      const permissions = await Permission.find({ _id: { $in: permissionIds } })
      if (permissions.length !== permissionIds.length) {
        return NextResponse.json(
          { error: 'Invalid permission IDs' },
          { status: 400 }
        )
      }
    }
    
    // If setting as default, unset other defaults
    if (isDefault) {
      await Role.updateMany({ isDefault: true }, { isDefault: false })
    }
    
    const role = await Role.create({
      name,
      displayName,
      description,
      permissions: permissionIds || [],
      isDefault: isDefault || false,
      createdBy: user.userId,
      updatedBy: user.userId,
    })
    
    const populatedRole = await Role.findById(role._id)
      .populate('permissions', 'name displayName module action')
      .lean()
    
    await auditLogFromRequest(request, user, 'create', 'role', {
      entityId: role._id.toString(),
      entityName: displayName,
      description: `Created role: ${displayName}`,
    })
    
    return NextResponse.json({ role: populatedRole }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create role' },
      { status: 500 }
    )
  }
}

