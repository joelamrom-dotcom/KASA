import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { AuditLog, Family, FamilyMember } from '@/lib/models'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET - Get payment plan change history for a family
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if family exists and user has access
    const family = await Family.findById(id)
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }
    
    // Check permission or ownership
    const canViewAll = await hasPermission(user, PERMISSIONS.FAMILIES_VIEW)
    const isFamilyOwner = family.userId?.toString() === user.userId
    const isFamilyMember = user.role === 'family' && user.familyId === id
    
    if (!canViewAll && !isFamilyOwner && !isFamilyMember) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this family' },
        { status: 403 }
      )
    }

    // Get all members for this family
    const members = await FamilyMember.find({ familyId: id }).select('_id firstName lastName').lean()
    const memberIds = members.map(m => m._id)

    // Get audit logs for payment plan changes
    const auditLogs = await AuditLog.find({
      entityType: 'member',
      entityId: { $in: memberIds },
      $or: [
        { 'changes.paymentPlan': { $exists: true } },
        { description: { $regex: /payment plan/i } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    // Format the response
    const history = auditLogs.map((log: any) => {
      const member = members.find((m: any) => m._id.toString() === log.entityId?.toString())
      const changes = log.changes?.paymentPlan || {}
      
      return {
        _id: log._id.toString(),
        date: log.createdAt,
        memberName: member ? `${member.firstName} ${member.lastName}` : log.entityName || 'Unknown',
        memberId: log.entityId?.toString(),
        oldPlan: changes.old || null,
        newPlan: changes.new || null,
        changedBy: log.userEmail || 'System',
        changedByRole: log.userRole || 'system',
        reason: log.metadata?.reason || 'manual_update',
        description: log.description || `Payment plan changed from Plan ${changes.old || 'None'} to Plan ${changes.new || 'None'}`
      }
    })

    return NextResponse.json({
      history,
      count: history.length
    })
  } catch (error: any) {
    console.error('Error fetching payment plan history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment plan history', details: error.message },
      { status: 500 }
    )
  }
}

