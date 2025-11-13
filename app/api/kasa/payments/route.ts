import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Payment, Family } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get all payments across all families
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
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
    const payments = await Payment.find(query)
      .populate('familyId', 'name hebrewName email phone')
      .sort({ paymentDate: -1 })
      .lean()

    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments', details: error.message },
      { status: 500 }
    )
  }
}

