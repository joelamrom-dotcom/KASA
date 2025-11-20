import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Payment, Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get payment history for current family (family portal)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only family role users can access this
    if (user.role !== 'family') {
      return NextResponse.json(
        { error: 'Access denied. This endpoint is for family users only.' },
        { status: 403 }
      )
    }

    // Find family by familyId from user
    if (!user.familyId) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const family = await Family.findById(user.familyId).lean()
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const familyId = String(family._id)
    
    // Build query
    const query: any = { familyId }
    if (year) {
      query.year = parseInt(year)
    }

    // Get payments
    const payments = await Payment.find(query)
      .sort({ paymentDate: -1 })
      .limit(limit)
      .skip(offset)
      .lean()

    // Get total count for pagination
    const totalCount = await Payment.countDocuments(query)

    // Calculate summary stats
    const currentYear = new Date().getFullYear()
    const paymentsThisYear = await Payment.aggregate([
      { $match: { familyId, year: currentYear } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ])
    
    const stats = paymentsThisYear.length > 0 
      ? { totalAmount: paymentsThisYear[0].total, count: paymentsThisYear[0].count }
      : { totalAmount: 0, count: 0 }

    return NextResponse.json({
      payments,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      stats
    })
  } catch (error: any) {
    console.error('Error fetching payment history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment history', details: error.message },
      { status: 500 }
    )
  }
}

