import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { SupportTicket, Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get support tickets for current family
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

    if (!user.familyId) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const query: any = { familyId: user.familyId }
    if (status) {
      query.status = status
    }

    const tickets = await SupportTicket.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean()

    const totalCount = await SupportTicket.countDocuments(query)

    return NextResponse.json({
      tickets,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error: any) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support tickets', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new support ticket
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { subject, description, category, priority } = body

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      )
    }

    const ticket = await SupportTicket.create({
      familyId: user.familyId,
      userId: user.userId,
      subject,
      description,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open',
      messages: [{
        from: 'family',
        userId: user.userId,
        message: description,
        createdAt: new Date()
      }]
    })

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate('assignedTo', 'firstName lastName email')
      .lean()

    return NextResponse.json(populatedTicket, { status: 201 })
  } catch (error: any) {
    console.error('Error creating support ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create support ticket', details: error.message },
      { status: 500 }
    )
  }
}

