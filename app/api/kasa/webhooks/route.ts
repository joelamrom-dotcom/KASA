import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - List webhooks
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Webhook schema would need to be added to models
    // For now, return empty array
    return NextResponse.json({ webhooks: [] })
  } catch (error: any) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhooks', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create webhook
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { url, events, secret } = body

    if (!url || !events || events.length === 0) {
      return NextResponse.json({ error: 'URL and events are required' }, { status: 400 })
    }

    // Webhook creation logic would go here
    // Would need Webhook schema in models

    return NextResponse.json({
      success: true,
      message: 'Webhook created (implementation pending)'
    })
  } catch (error: any) {
    console.error('Error creating webhook:', error)
    return NextResponse.json(
      { error: 'Failed to create webhook', details: error.message },
      { status: 500 }
    )
  }
}

