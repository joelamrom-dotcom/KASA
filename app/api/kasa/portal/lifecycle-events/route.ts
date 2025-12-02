import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { LifecycleEventPayment, Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get lifecycle events for current family (family portal)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only family role users can access this
    if (user.role !== 'family') {
      return NextResponse.json(
        { error: 'Access denied. This endpoint is for family users only.' },
        { status: 403 }
      )
    }

    // Find family by familyId from user
    if (!user.familyId) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const family = await Family.findById(user.familyId).lean()
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const familyId = String(family._id)
    
    const searchParams = request.nextUrl.searchParams
    const upcoming = searchParams.get('upcoming') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query
    const query: any = { familyId }
    
    if (upcoming) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      query.eventDate = { $gte: today }
    }

    // Get lifecycle events
    const events = await LifecycleEventPayment.find(query)
      .sort(upcoming ? { eventDate: 1 } : { eventDate: -1 })
      .limit(limit)
      .lean()

    // Format event type labels
    const eventTypeLabels: { [key: string]: string } = {
      'chasena': 'Chasena (Wedding)',
      'bar_mitzvah': 'Bar/Bat Mitzvah',
      'birth_boy': 'Birth Boy',
      'birth_girl': 'Birth Girl'
    }

    const formattedEvents = events.map((event: any) => ({
      _id: event._id.toString(),
      eventType: event.eventType,
      eventTypeLabel: eventTypeLabels[event.eventType] || event.eventType,
      eventDate: event.eventDate,
      year: event.year,
      amount: event.amount || 0,
      notes: event.notes || ''
    }))

    return NextResponse.json({
      events: formattedEvents,
      count: formattedEvents.length
    })
  } catch (error: any) {
    console.error('Error fetching lifecycle events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lifecycle events', details: error.message },
      { status: 500 }
    )
  }
}

