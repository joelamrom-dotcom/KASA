import { NextRequest, NextResponse } from 'next/server'
import db from '../../../lib/database-adapter.js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const userId = searchParams.get('userId')

    console.log(`API: Fetching activities - page: ${page}, limit: ${limit}, userId: ${userId || 'all'}`)
    
    // Add overall timeout to prevent hanging
    const result = await Promise.race([
      db.getActivities(page, limit, userId as any),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 8 seconds')), 8000)
      )
    ]) as any
    
    console.log(`API: Found ${result?.activities?.length || 0} activities`)
    
    // Ensure we always return a valid format
    if (!result || (!result.activities && !Array.isArray(result))) {
      console.warn('API: Unexpected result format, returning empty array')
      return NextResponse.json({ activities: [], pagination: { page, limit, total: 0, totalPages: 0 } })
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Get activities error:', error)
    console.error('Error stack:', error?.stack)
    
    // Return empty result instead of error for better UX
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to fetch activities',
        activities: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      },
      { status: 200 } // Return 200 with empty data instead of 500
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, description, metadata } = body

    // Validate required fields
    if (!userId || !type || !description) {
      return NextResponse.json(
        { error: 'User ID, type, and description are required' },
        { status: 400 }
      )
    }

    // Log activity
    const newActivity = await db.logActivity({
      userId,
      type,
      description,
      metadata
    })

    return NextResponse.json({
      message: 'Activity logged successfully',
      activity: newActivity
    }, { status: 201 })

  } catch (error) {
    console.error('Log activity error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
