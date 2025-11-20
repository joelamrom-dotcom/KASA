import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { SupportTicket } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get a specific support ticket
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

    // Only family role users can access this
    if (user.role !== 'family') {
      return NextResponse.json(
        { error: 'Access denied. This endpoint is for family users only.' },
        { status: 403 }
      )
    }

    if (!user.familyId) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const ticket = await SupportTicket.findOne({
      _id: params.id,
      familyId: user.familyId
    })
      .populate('assignedTo', 'firstName lastName email')
      .populate('messages.userId', 'firstName lastName email')
      .lean()

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(ticket)
  } catch (error: any) {
    console.error('Error fetching support ticket:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support ticket', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Add a message to a support ticket
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

    // Only family role users can access this
    if (user.role !== 'family') {
      return NextResponse.json(
        { error: 'Access denied. This endpoint is for family users only.' },
        { status: 403 }
      )
    }

    if (!user.familyId) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const ticket = await SupportTicket.findOne({
      _id: params.id,
      familyId: user.familyId
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Check if ticket is closed
    if (ticket.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot add messages to a closed ticket' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Add message from family
    ticket.messages.push({
      from: 'family',
      userId: user.userId,
      message,
      createdAt: new Date()
    })

    // Update status to open if it was resolved
    if (ticket.status === 'resolved') {
      ticket.status = 'open'
    }

    await ticket.save()

    const updatedTicket = await SupportTicket.findById(ticket._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('messages.userId', 'firstName lastName email')
      .lean()

    return NextResponse.json(updatedTicket)
  } catch (error: any) {
    console.error('Error adding message to support ticket:', error)
    return NextResponse.json(
      { error: 'Failed to add message', details: error.message },
      { status: 500 }
    )
  }
}

