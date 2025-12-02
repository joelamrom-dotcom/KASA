import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, MessageTemplate } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - Create communication campaign
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, templateId, recipients, schedule, abTest } = body

    if (!name || !type || !recipients) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Get recipient families
    const query: any = { userId }
    if (recipients.familyIds && recipients.familyIds.length > 0) {
      query._id = { $in: recipients.familyIds.map((id: string) => new mongoose.Types.ObjectId(id)) }
    } else if (recipients.filters) {
      // Apply filters
    }

    const families = await Family.find(query).lean()

    // Campaign would be stored in Campaign schema
    const campaign = {
      name,
      type, // 'email', 'sms'
      templateId,
      recipients: families.map((f: any) => ({
        familyId: f._id.toString(),
        email: f.email,
        phone: f.phone
      })),
      schedule,
      abTest: abTest || null,
      status: 'draft',
      createdBy: user.userId,
      createdAt: new Date()
    }

    return NextResponse.json({ campaign })
  } catch (error: any) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign', details: error.message },
      { status: 500 }
    )
  }
}

