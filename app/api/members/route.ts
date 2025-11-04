import { NextRequest, NextResponse } from 'next/server'
import db from '../../../lib/database-adapter.js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const result = await db.getMembers(page, limit, search)

    return NextResponse.json({
      members: result.data,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    // Check if member already exists
    const existingMember = await db.getMemberByEmail(body.email)
    if (existingMember) {
      return NextResponse.json(
        { error: 'Member with this email already exists' },
        { status: 409 }
      )
    }

    const newMember = await db.createMember(body)

    // Log activity
    await db.logActivity({
      userId: body.createdBy || null,
      type: 'member_created',
      description: `New member created: ${body.firstName} ${body.lastName}`,
      metadata: {
        memberId: newMember.id,
        email: body.email
      }
    })

    return NextResponse.json(newMember, { status: 201 })
  } catch (error) {
    console.error('Error creating member:', error)
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    )
  }
}
