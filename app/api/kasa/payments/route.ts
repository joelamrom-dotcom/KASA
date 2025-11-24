import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Payment, Family } from '@/lib/models'
import { getAuthenticatedUser, isAdmin, isImpersonating } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

// GET - Get all payments across all families (filtered by user)
export async function GET(request: NextRequest) {
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
    
    // Check if impersonating - if so, use impersonated user's permissions (not super_admin)
    const impersonating = isImpersonating(request)
    
    const { searchParams } = new URL(request.url)
    const familyId = searchParams.get('familyId')
    const year = searchParams.get('year')
    const paymentMethod = searchParams.get('paymentMethod')
    const type = searchParams.get('type')

    // Build query
    const query: any = {}
    if (familyId) query.familyId = familyId
    if (year) query.year = parseInt(year)
    if (paymentMethod) query.paymentMethod = paymentMethod
    if (type) query.type = type

    // Get payments with family information
    let payments = await Payment.find(query)
      .populate('familyId', 'name hebrewName email phone userId')
      .sort({ paymentDate: -1 })
      .lean()

    // Check permission
    const canView = await hasPermission(user, PERMISSIONS.PAYMENTS_VIEW)
    if (!canView && user.role !== 'family') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Filter payments by user's families
    // Super_admin should see only their own families' payments (not all payments)
    // When impersonating, they see the impersonated user's payments
    // To see all payments, super_admin must impersonate a user who has access to those families
    let userFamilyIds: string[] = []
    
    if (user.role === 'family' && user.familyId) {
      // Family users see only their own family's payments
      userFamilyIds = [user.familyId.toString()]
    } else {
      // Regular admins and super_admins see only their own families' payments
      // Include legacy families (without userId) for backward compatibility
      const userFamilies = await Family.find({
        $or: [
          { userId: user.userId },
          { userId: { $exists: false } }, // Legacy families without userId
          { userId: null } // Families with null userId
        ]
      }).select('_id').lean()
      userFamilyIds = userFamilies.map((f: any) => f._id.toString())
    }
    
    // If user has no families, they should see no payments
    if (userFamilyIds.length === 0) {
      payments = []
    } else {
      // Filter payments to only those belonging to user's families
      payments = payments.filter((payment: any) => {
        if (!payment.familyId) {
          return false // Exclude payments with no family
        }
        const paymentFamilyId = payment.familyId?._id?.toString() || payment.familyId?.toString()
        return paymentFamilyId && userFamilyIds.includes(paymentFamilyId)
      })
    }

    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments', details: error.message },
      { status: 500 }
    )
  }
}

