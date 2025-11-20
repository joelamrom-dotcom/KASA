import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, FamilyMember } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'
import { invalidateCache, CacheKeys } from '@/lib/cache'
import { performanceMonitor } from '@/lib/performance'

/**
 * Bulk operations for families
 * Supports: update, delete, tag, export
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, familyIds, updates } = body

    if (!action || !Array.isArray(familyIds) || familyIds.length === 0) {
      return NextResponse.json(
        { error: 'Action and familyIds are required' },
        { status: 400 }
      )
    }

    const end = performanceMonitor.start('bulk:families')

    // Check permission - users with families.update can update all families
    const canUpdateAll = await hasPermission(user, PERMISSIONS.FAMILIES_UPDATE)
    const canDeleteAll = await hasPermission(user, PERMISSIONS.FAMILIES_DELETE)
    
    // Build query based on permissions
    let query: any = { _id: { $in: familyIds } }
    if (!canUpdateAll && !canDeleteAll && user.role !== 'super_admin') {
      query.userId = user.userId
    }

    let result: any = {}

    switch (action) {
      case 'update':
        if (!updates || Object.keys(updates).length === 0) {
          return NextResponse.json(
            { error: 'Updates are required for update action' },
            { status: 400 }
          )
        }

        // Build update object
        const updateData: any = {}
        if (updates.paymentPlanId) updateData.paymentPlanId = updates.paymentPlanId
        if (updates.city) updateData.city = updates.city
        if (updates.state) updateData.state = updates.state
        if (updates.zip) updateData.zip = updates.zip
        if (updates.receiveEmails !== undefined) updateData.receiveEmails = updates.receiveEmails
        if (updates.receiveSMS !== undefined) updateData.receiveSMS = updates.receiveSMS
        if (updates.currentPayment !== undefined) updateData.currentPayment = updates.currentPayment

        const updateResult = await Family.updateMany(query, { $set: updateData })
        result = {
          success: true,
          updated: updateResult.modifiedCount,
          message: `Updated ${updateResult.modifiedCount} families`,
        }
        break

      case 'delete':
        // Move to recycle bin (soft delete)
        const { moveToRecycleBin } = await import('@/lib/recycle-bin')
        const familiesToDelete = await Family.find(query).lean()

        let deletedCount = 0
        for (const family of familiesToDelete) {
          const familyId = (family as any)._id?.toString() || family._id
          // Move related records
          const members = await FamilyMember.find({ familyId })
          for (const member of members) {
            await moveToRecycleBin('member', member._id.toString(), member.toObject())
          }

          // Move family
          await moveToRecycleBin('family', familyId, family)
          deletedCount++
        }

        // Create audit log entry
        if (deletedCount > 0) {
          await auditLogFromRequest(request, user, 'bulk_family_delete', 'family', {
            entityId: familyIds[0], // Use first ID as representative
            entityName: `Bulk delete ${deletedCount} families`,
            description: `Bulk deleted ${deletedCount} families`,
            metadata: {
              action: 'delete',
              deletedCount,
              familyIds: familyIds.slice(0, 10), // First 10 IDs
            }
          })
        }
        
        result = {
          success: true,
          deleted: deletedCount,
          message: `Deleted ${deletedCount} families`,
        }
        break

      case 'tag':
        if (!updates?.tags || !Array.isArray(updates.tags)) {
          return NextResponse.json(
            { error: 'Tags array is required for tag action' },
            { status: 400 }
          )
        }

        // Add tags to families (using $addToSet to avoid duplicates)
        const tagResult = await Family.updateMany(query, {
          $addToSet: { tags: { $each: updates.tags } },
        })
        result = {
          success: true,
          updated: tagResult.modifiedCount,
          message: `Tagged ${tagResult.modifiedCount} families`,
        }
        break

      case 'untag':
        if (!updates?.tags || !Array.isArray(updates.tags)) {
          return NextResponse.json(
            { error: 'Tags array is required for untag action' },
            { status: 400 }
          )
        }

        // Remove tags from families
        const untagResult = await Family.updateMany(query, {
          $pull: { tags: { $in: updates.tags } },
        })
        result = {
          success: true,
          updated: untagResult.modifiedCount,
          message: `Untagged ${untagResult.modifiedCount} families`,
        }
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    // Invalidate cache
    invalidateCache('families')

    end({ action, count: familyIds.length })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}

/**
 * Bulk export families
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const familyIds = searchParams.get('ids')?.split(',') || []

    if (familyIds.length === 0) {
      return NextResponse.json(
        { error: 'Family IDs are required' },
        { status: 400 }
      )
    }

    // Build query
    let query: any = { _id: { $in: familyIds } }
    if (!isAdmin(user) && user.role !== 'super_admin') {
      query.userId = user.userId
    }

    const families = await Family.find(query).lean()

    return NextResponse.json(families)
  } catch (error: any) {
    console.error('Error exporting families:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export families' },
      { status: 500 }
    )
  }
}

