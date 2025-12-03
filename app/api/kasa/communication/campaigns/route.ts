import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, MessageTemplate, Campaign } from '@/lib/models'

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

    const campaignRecipients = families.map((f: any) => ({
      familyId: f._id,
      email: f.email,
      phone: f.phone,
      status: 'pending'
    }))

    const campaign = await Campaign.create({
      userId,
      name,
      type,
      templateId: templateId ? new mongoose.Types.ObjectId(templateId) : undefined,
      recipients: campaignRecipients,
      schedule: schedule ? {
        scheduledAt: new Date(schedule.scheduledAt),
        timezone: schedule.timezone || 'UTC'
      } : undefined,
      abTest: abTest || undefined,
      status: 'draft',
      stats: {
        total: campaignRecipients.length,
        sent: 0,
        failed: 0,
        opened: 0,
        clicked: 0
      }
    })

    return NextResponse.json({ campaign })
  } catch (error: any) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign', details: error.message },
      { status: 500 }
    )
  }
}

