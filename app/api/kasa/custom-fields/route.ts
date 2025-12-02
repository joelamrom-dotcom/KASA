import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { CustomField } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get custom fields
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get('entityType') // 'family', 'member', 'payment'

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const query: any = { userId, isActive: true }
    if (entityType) {
      query.entityType = entityType
    }

    const fields = await CustomField.find(query)
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean()

    return NextResponse.json({ fields })
  } catch (error: any) {
    console.error('Error fetching custom fields:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom fields', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create custom field
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { entityType, name, fieldType, options, required, defaultValue } = body

    if (!entityType || !name || !fieldType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const field = await CustomField.create({
      userId,
      entityType,
      name,
      fieldType,
      options: options || [],
      required: required || false,
      defaultValue
    })

    return NextResponse.json({ field })
  } catch (error: any) {
    console.error('Error creating custom field:', error)
    return NextResponse.json(
      { error: 'Failed to create custom field', details: error.message },
      { status: 500 }
    )
  }
}

