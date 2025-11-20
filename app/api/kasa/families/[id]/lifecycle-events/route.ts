import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { LifecycleEventPayment, LifecycleEvent, Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

// GET - Get all lifecycle events for a family
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if family exists and user has access
    const family = await Family.findById(params.id)
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }
    
    // Check permission or ownership
    const canViewAll = await hasPermission(user, PERMISSIONS.LIFECYCLE_EVENTS_VIEW)
    const isFamilyOwner = family.userId?.toString() === user.userId
    const isFamilyMember = user.role === 'family' && user.familyId === params.id
    
    if (!canViewAll && !isFamilyOwner && !isFamilyMember) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this family' },
        { status: 403 }
      )
    }
    
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
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if family exists and user has access
    const family = await Family.findById(params.id)
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }
    
    // Check permission or ownership
    const canCreateAll = await hasPermission(user, PERMISSIONS.LIFECYCLE_EVENTS_CREATE)
    const isFamilyOwner = family.userId?.toString() === user.userId
    
    if (!canCreateAll && !isFamilyOwner) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to create lifecycle events for this family' },
        { status: 403 }
      )
    }
    
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
    await auditLogFromRequest(request, user, 'lifecycle_event_create', 'lifecycle_event', {
      entityId: event._id.toString(),
      entityName: `${eventType} - $${eventAmount}`,
      description: `Created lifecycle event "${eventType}" ($${eventAmount})${family ? ` for family "${family.name}"` : ''}`,
      metadata: {
        eventType: eventType.toLowerCase(),
        amount: parseFloat(eventAmount),
        eventDate: new Date(eventDate),
        year: parseInt(year),
        familyId: params.id,
        familyName: family?.name,
      }
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error: any) {
    console.error('Error creating lifecycle event:', error)
    return NextResponse.json(
      { error: 'Failed to create lifecycle event', details: error.message },
      { status: 500 }
    )
  }
}

