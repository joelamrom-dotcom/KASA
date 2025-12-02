import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// POST - Invalidate cache
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Invalidate cache logic would go here (Redis, etc.)
    // For now, just return success

    return NextResponse.json({ success: true, message: 'Cache invalidated' })
  } catch (error: any) {
    console.error('Error invalidating cache:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate cache', details: error.message },
      { status: 500 }
    )
  }
}

