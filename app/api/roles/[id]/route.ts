import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Role, Permission, User } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

/**
 * GET /api/roles/[id]
 * Get a specific role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!(await hasPermission(user, PERMISSIONS.ROLES_VIEW))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const role = await Role.findById(params.id)
      .populate('permissions', 'name displayName module action')
      .populate('createdBy', 'email firstName lastName')
      .populate('updatedBy', 'email firstName lastName')
      .lean()
    
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }
    
    return NextResponse.json({ role })
  } catch (error: any) {
    console.error('Error fetching role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch role' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/roles/[id]
 * Update a role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!(await hasPermission(user, PERMISSIONS.ROLES_UPDATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const role = await Role.findById(params.id)
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }
    
    // System roles can only be updated by super_admin
    if (role.isSystem && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot modify system roles' },
        { status: 403 }
      )
    }
    
    const data = await request.json()
    const { displayName, description, permissions: permissionIds, isDefault } = data
    
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
    if (isDefault && !role.isDefault) {
      await Role.updateMany({ isDefault: true }, { isDefault: false })
    }
    
    // Update role
    if (displayName !== undefined) role.displayName = displayName
    if (description !== undefined) role.description = description
    if (permissionIds !== undefined) role.permissions = permissionIds
    if (isDefault !== undefined) role.isDefault = isDefault
    role.updatedBy = user.userId
    
    await role.save()
    
    const updatedRole = await Role.findById(role._id)
      .populate('permissions', 'name displayName module action')
      .lean()
    
    await auditLogFromRequest(request, user, 'update', 'role', {
      entityId: role._id.toString(),
      entityName: role.displayName,
      description: `Updated role: ${role.displayName}`,
    })
    
    return NextResponse.json({ role: updatedRole })
  } catch (error: any) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update role' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/roles/[id]
 * Delete a role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!(await hasPermission(user, PERMISSIONS.ROLES_DELETE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const role = await Role.findById(params.id)
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }
    
    // Cannot delete system roles
    if (role.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system roles' },
        { status: 400 }
      )
    }
    
    // Check if any users are using this role
    const usersWithRole = await User.countDocuments({ customRoleId: role._id })
    if (usersWithRole > 0) {
      return NextResponse.json(
        { error: `Cannot delete role: ${usersWithRole} user(s) are assigned to this role` },
        { status: 400 }
      )
    }
    
    await auditLogFromRequest(request, user, 'delete', 'role', {
      entityId: role._id.toString(),
      entityName: role.displayName,
      description: `Deleted role: ${role.displayName}`,
    })
    
    await Role.findByIdAndDelete(params.id)
    
    return NextResponse.json({ message: 'Role deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete role' },
      { status: 500 }
    )
  }
}

