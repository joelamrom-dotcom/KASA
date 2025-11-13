import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Payment } from '@/lib/models'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    
    const query: any = { memberId: params.memberId }
    if (year) {
      query.year = parseInt(year)
    }
    
    const payments = await Payment.find(query)
      .sort({ paymentDate: -1 })
      .lean()
    
    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('Error fetching member payments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch member payments' },
      { status: 500 }
    )
  }
}

