import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { calculateMemberBalance } from '@/lib/calculations'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const asOfDateParam = searchParams.get('asOfDate')
    const asOfDate = asOfDateParam ? new Date(asOfDateParam) : new Date()
    
    const balance = await calculateMemberBalance(params.memberId, asOfDate)
    
    return NextResponse.json(balance)
  } catch (error: any) {
    console.error('Error calculating member balance:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to calculate member balance' },
      { status: 500 }
    )
  }
}

