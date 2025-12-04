import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get all sub-families (families created from members of this family)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    const subFamilies = await Family.find({ parentFamilyId: id })
      .sort({ weddingDate: -1 })
      .lean()
    
    return NextResponse.json(subFamilies)
  } catch (error: any) {
    console.error('Error fetching sub-families:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sub-families', details: error.message },
      { status: 500 }
    )
  }
}
