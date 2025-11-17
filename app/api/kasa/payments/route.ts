import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Payment, Family } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

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

    // Filter by user ownership - admin sees all, regular users only their families' payments
    if (!isAdmin(user)) {
      // Get user's family IDs
      const userFamilies = await Family.find({ userId: user.userId }).select('_id')
      const userFamilyIds = userFamilies.map(f => f._id.toString())
      
      // Filter payments to only those belonging to user's families
      payments = payments.filter((payment: any) => {
        const paymentFamilyId = payment.familyId?._id?.toString() || payment.familyId?.toString()
        return userFamilyIds.includes(paymentFamilyId)
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

