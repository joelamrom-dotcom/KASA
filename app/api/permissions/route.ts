import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Permission } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

/**
 * GET /api/permissions
 * Get all permissions (requires roles.view permission)
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
    
    const permissions = await Permission.find().sort({ module: 1, action: 1 }).lean()
    
    return NextResponse.json({ permissions })
  } catch (error: any) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/permissions
 * Create a new permission (super_admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const data = await request.json()
    const { name, displayName, module, action, description } = data
    
    if (!name || !displayName || !module || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check if permission already exists
    const existing = await Permission.findOne({ name })
    if (existing) {
      return NextResponse.json(
        { error: 'Permission already exists' },
        { status: 400 }
      )
    }
    
    const permission = await Permission.create({
      name,
      displayName,
      module,
      action,
      description,
    })
    
    await auditLogFromRequest(request, user, 'create', 'permission', {
      entityId: permission._id.toString(),
      entityName: displayName,
      description: `Created permission: ${displayName}`,
    })
    
    return NextResponse.json({ permission }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating permission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create permission' },
      { status: 500 }
    )
  }
}

