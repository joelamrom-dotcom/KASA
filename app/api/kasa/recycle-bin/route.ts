import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { RecycleBin, Family } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get all items in recycle bin (filtered by user)
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
    
    const searchParams = request.nextUrl.searchParams
    const recordType = searchParams.get('type') // Optional filter by type
    
    let query: any = { restoredAt: null } // Only show non-restored items
    if (recordType) {
      query.recordType = recordType
    }
    
    let items = await RecycleBin.find(query)
      .sort({ deletedAt: -1 }) // Newest deleted first
      .lean()
    
    // Filter by user ownership - admin sees all, regular users only their families' deleted items
    if (!isAdmin(user)) {
      // Get user's family IDs
      const userFamilies = await Family.find({ userId: user.userId }).select('_id')
      const userFamilyIds = userFamilies.map(f => f._id.toString())
      
      // Filter recycle bin items to only those belonging to user's families
      items = items.filter((item: any) => {
        // For family records, check if the originalId matches user's family IDs
        if (item.recordType === 'family') {
          return userFamilyIds.includes(item.originalId)
        }
        // For other records (members, payments, etc.), check if they belong to user's families
        if (item.recordData?.familyId) {
          const familyId = item.recordData.familyId.toString()
          return userFamilyIds.includes(familyId)
        }
        // For tasks, check userId
        if (item.recordType === 'task' && item.recordData?.userId) {
          return item.recordData.userId.toString() === user.userId
        }
        // For reports, check userId
        if (item.recordType === 'report' && item.recordData?.userId) {
          return item.recordData.userId.toString() === user.userId
        }
        return false
      })
    }
    
    return NextResponse.json(items)
  } catch (error: any) {
    console.error('Error fetching recycle bin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recycle bin', details: error.message },
      { status: 500 }
    )
  }
}

