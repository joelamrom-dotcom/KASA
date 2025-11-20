import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, Task, Report, User } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

/**
 * Migration endpoint to assign existing data to users
 * This should be run once to migrate existing data
 * Admin only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Get authenticated user
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check permission - only super_admin or users with users.update can migrate data
    const canManageUsers = await hasPermission(user, PERMISSIONS.USERS_UPDATE)
    
    if (!canManageUsers && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - User management permission required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { assignToUserId } = body
    
    if (!assignToUserId) {
      return NextResponse.json(
        { error: 'assignToUserId is required' },
        { status: 400 }
      )
    }
    
    // Verify user exists
    const targetUser = await User.findById(assignToUserId)
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }
    
    let migrated = {
      families: 0,
      tasks: 0,
      reports: 0
    }
    
    // Migrate families without userId
    const familiesWithoutUser = await Family.find({ userId: { $exists: false } })
    for (const family of familiesWithoutUser) {
      await Family.findByIdAndUpdate(family._id, { userId: assignToUserId })
      migrated.families++
    }
    
    // Migrate tasks without userId
    const tasksWithoutUser = await Task.find({ userId: { $exists: false } })
    for (const task of tasksWithoutUser) {
      await Task.findByIdAndUpdate(task._id, { userId: assignToUserId })
      migrated.tasks++
    }
    
    // Migrate reports without userId
    const reportsWithoutUser = await Report.find({ userId: { $exists: false } })
    for (const report of reportsWithoutUser) {
      await Report.findByIdAndUpdate(report._id, { userId: assignToUserId })
      migrated.reports++
    }
    
    // Create audit log entry
    await auditLogFromRequest(request, user, 'data_migration', 'system', {
      entityName: 'User Data Migration',
      description: `Migrated ${migrated.families} families, ${migrated.tasks} tasks, and ${migrated.reports} reports to user ${targetUser.email}`,
      metadata: {
        assignedToUserId: assignToUserId,
        assignedToEmail: targetUser.email,
        migrated,
      }
    })
    
    return NextResponse.json({
      message: 'Migration completed',
      migrated,
      assignedTo: targetUser.email
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    )
  }
}

