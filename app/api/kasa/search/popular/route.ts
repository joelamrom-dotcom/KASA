import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get popular searches
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return popular searches (would be stored in SearchHistory schema)
    const popularSearches = [
      'families with overdue payments',
      'upcoming lifecycle events',
      'recent payments',
      'families by payment plan',
      'bar mitzvah dates'
    ]

    return NextResponse.json({ searches: popularSearches })
  } catch (error: any) {
    console.error('Error fetching popular searches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular searches', details: error.message },
      { status: 500 }
    )
  }
}

