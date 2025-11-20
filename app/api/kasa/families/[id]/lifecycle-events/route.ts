import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { LifecycleEventPayment, LifecycleEvent, Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

// GET - Get all lifecycle events for a family
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const events = await LifecycleEventPayment.find({ familyId: params.id }).sort({ eventDate: -1 })
    return NextResponse.json(events)
  } catch (error: any) {
    console.error('Error fetching lifecycle events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lifecycle events', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Add a new lifecycle event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const body = await request.json()
    const { eventType, amount, eventDate, year, notes } = body

    if (!eventType || !eventDate || !year) {
      return NextResponse.json(
        { error: 'Event type, event date, and year are required' },
        { status: 400 }
      )
    }

    // Look up event type from database to get the amount
    let eventAmount = amount
    if (!eventAmount) {
      const eventTypeRecord = await LifecycleEvent.findOne({ type: eventType.toLowerCase() })
      if (eventTypeRecord) {
        eventAmount = eventTypeRecord.amount
      } else {
        return NextResponse.json(
          { error: `Event type '${eventType}' not found in database. Please create it first or provide an amount.` },
          { status: 400 }
        )
      }
    }

    const event = await LifecycleEventPayment.create({
      familyId: params.id,
      eventType: eventType.toLowerCase(),
      amount: parseFloat(eventAmount),
      eventDate: new Date(eventDate),
      year: parseInt(year),
      notes: notes || undefined
    })

    // Create audit log entry
    try {
      const { createAuditLog, getIpAddress, getUserAgent } = await import('@/lib/audit-log')
      const user = getAuthenticatedUser(request)
      const family = await Family.findById(params.id)
      
      if (user) {
        await createAuditLog({
          userId: user.userId,
          userEmail: user.email,
          userRole: user.role,
          action: 'lifecycle_event_create',
          entityType: 'lifecycle_event',
          entityId: event._id.toString(),
          entityName: `${eventType} - $${eventAmount}`,
          description: `Created lifecycle event "${eventType}" ($${eventAmount})${family ? ` for family "${family.name}"` : ''}`,
          ipAddress: getIpAddress(request),
          userAgent: getUserAgent(request),
          metadata: {
            eventType: eventType.toLowerCase(),
            amount: parseFloat(eventAmount),
            eventDate: new Date(eventDate),
            year: parseInt(year),
            familyId: params.id,
            familyName: family?.name,
          }
        })
      }
    } catch (auditError: any) {
      console.error('Error creating audit log:', auditError)
    }

    return NextResponse.json(event, { status: 201 })
  } catch (error: any) {
    console.error('Error creating lifecycle event:', error)
    return NextResponse.json(
      { error: 'Failed to create lifecycle event', details: error.message },
      { status: 500 }
    )
  }
}

