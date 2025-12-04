import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { LifecycleEventPayment, Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

// GET - Get a specific lifecycle event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id, eventId } = await params
    const event = await LifecycleEventPayment.findOne({
      _id: eventId,
      familyId: id,
    })
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    return NextResponse.json(event)
  } catch (error: any) {
    console.error('Error fetching lifecycle event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lifecycle event', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update a lifecycle event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id, eventId } = await params
    // Check if event exists
    const event = await LifecycleEventPayment.findOne({
      _id: eventId,
      familyId: id,
    })
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.LIFECYCLE_EVENTS_UPDATE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const { eventType, amount, eventDate, year, notes } = body
    
    const oldEvent = { ...event.toObject() }
    const updateData: any = {}
    
    if (eventType !== undefined) updateData.eventType = eventType.toLowerCase()
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (eventDate !== undefined) updateData.eventDate = new Date(eventDate)
    if (year !== undefined) updateData.year = parseInt(year)
    if (notes !== undefined) updateData.notes = notes
    
    const updatedEvent = await LifecycleEventPayment.findByIdAndUpdate(
      eventId,
      updateData,
      { new: true, runValidators: true }
    )
    
    // Trigger automation rules for lifecycle event updated
    try {
      const { executeAutomationRules } = await import('@/lib/automation-engine')
      await executeAutomationRules(
        {
          type: 'lifecycle_event_updated',
          familyId: id,
          eventId: eventId,
          data: {
            oldEvent,
            updatedEvent: updatedEvent?.toObject(),
            changedFields: Object.keys(updateData),
          },
        },
        user.userId
      )
    } catch (automationError) {
      console.error('Error executing automation rules for lifecycle event update:', automationError)
      // Don't fail the update if automation fails
    }
    
    // Create audit log entry
    await auditLogFromRequest(request, user, 'lifecycle_event_update', 'lifecycle_event', {
      entityId: eventId,
      entityName: `${updatedEvent?.eventType} - $${updatedEvent?.amount}`,
      description: `Updated lifecycle event`,
      metadata: {
        familyId: id,
        changedFields: Object.keys(updateData),
      }
    })
    
    return NextResponse.json(updatedEvent)
  } catch (error: any) {
    console.error('Error updating lifecycle event:', error)
    return NextResponse.json(
      { error: 'Failed to update lifecycle event', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a lifecycle event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.LIFECYCLE_EVENTS_DELETE))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const { id, eventId } = await params
    const event = await LifecycleEventPayment.findOneAndDelete({
      _id: eventId,
      familyId: id,
    })
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting lifecycle event:', error)
    return NextResponse.json(
      { error: 'Failed to delete lifecycle event', details: error.message },
      { status: 500 }
    )
  }
}

