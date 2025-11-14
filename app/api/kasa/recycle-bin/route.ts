import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { RecycleBin } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get all items in recycle bin
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const recordType = searchParams.get('type') // Optional filter by type
    
    const query: any = { restoredAt: null } // Only show non-restored items
    if (recordType) {
      query.recordType = recordType
    }
    
    const items = await RecycleBin.find(query)
      .sort({ deletedAt: -1 }) // Newest deleted first
      .lean()
    
    return NextResponse.json(items)
  } catch (error: any) {
    console.error('Error fetching recycle bin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recycle bin', details: error.message },
      { status: 500 }
    )
  }
}

