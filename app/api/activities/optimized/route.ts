import { NextRequest, NextResponse } from 'next/server'
import db from '../../../../lib/database-adapter.js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const userIdParam = searchParams.get('userId')
    const userId = userIdParam || null

    const result = await db.getActivities(page, limit, userId as any)

    return NextResponse.json({
      activities: result.data,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.type || !body.description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const newActivity = await db.logActivity(body)
    return NextResponse.json(newActivity, { status: 201 })
  } catch (error) {
    console.error('Error logging activity:', error)
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    )
  }
}
