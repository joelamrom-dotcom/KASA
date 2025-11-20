import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Payment, Family } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { invalidateCache } from '@/lib/cache'
import { performanceMonitor } from '@/lib/performance'

/**
 * Bulk operations for payments
 * Supports: update, delete, export
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, paymentIds, updates } = body

    if (!action || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: 'Action and paymentIds are required' },
        { status: 400 }
      )
    }

    const end = performanceMonitor.start('bulk:payments')

    // Build query - get user's families first
    let query: any = { _id: { $in: paymentIds } }
    
    if (!isAdmin(user) && user.role !== 'super_admin') {
      // Get user's families
      const userFamilies = await Family.find({ userId: user.userId }).select('_id').lean()
      const userFamilyIds = userFamilies.map(f => f._id)
      query.familyId = { $in: userFamilyIds }
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

        const updateData: any = {}
        if (updates.type) updateData.type = updates.type
        if (updates.year) updateData.year = updates.year
        if (updates.notes !== undefined) updateData.notes = updates.notes

        const updateResult = await Payment.updateMany(query, { $set: updateData })
        result = {
          success: true,
          updated: updateResult.modifiedCount,
          message: `Updated ${updateResult.modifiedCount} payments`,
        }
        break

      case 'delete':
        // Hard delete payments (or move to recycle bin if you prefer)
        const deleteResult = await Payment.deleteMany(query)
        result = {
          success: true,
          deleted: deleteResult.deletedCount,
          message: `Deleted ${deleteResult.deletedCount} payments`,
        }
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    // Invalidate cache
    invalidateCache('payments')

    end({ action, count: paymentIds.length })

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
 * Bulk export payments
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentIds = searchParams.get('ids')?.split(',') || []

    if (paymentIds.length === 0) {
      return NextResponse.json(
        { error: 'Payment IDs are required' },
        { status: 400 }
      )
    }

    // Build query
    let query: any = { _id: { $in: paymentIds } }
    
    if (!isAdmin(user) && user.role !== 'super_admin') {
      const userFamilies = await Family.find({ userId: user.userId }).select('_id').lean()
      const userFamilyIds = userFamilies.map(f => f._id)
      query.familyId = { $in: userFamilyIds }
    }

    const payments = await Payment.find(query).populate('familyId', 'name email').lean()

    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('Error exporting payments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export payments' },
      { status: 500 }
    )
  }
}

