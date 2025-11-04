import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { LifecycleEventPayment } from '@/lib/models'

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

    if (!eventType || !amount || !eventDate || !year) {
      return NextResponse.json(
        { error: 'Event type, amount, event date, and year are required' },
        { status: 400 }
      )
    }

    const event = await LifecycleEventPayment.create({
      familyId: params.id,
      eventType,
      amount: parseFloat(amount),
      eventDate: new Date(eventDate),
      year: parseInt(year),
      notes: notes || undefined
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

