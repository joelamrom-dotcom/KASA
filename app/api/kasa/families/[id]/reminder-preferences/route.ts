import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get reminder preferences for a family
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const family = await Family.findById(id).lean()
    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    const preferences = {
      reminderFrequency: (family as any).reminderFrequency || 'weekly',
      preferredReminderDay: (family as any).preferredReminderDay || 1, // Monday
      emailReminders: (family as any).receiveEmails !== false,
      smsReminders: (family as any).receiveSMS !== false,
      reminderAdvanceDays: (family as any).reminderAdvanceDays || 7
    }

    return NextResponse.json(preferences)
  } catch (error: any) {
    console.error('Error fetching reminder preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update reminder preferences
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reminderFrequency, preferredReminderDay, emailReminders, smsReminders, reminderAdvanceDays } = body

    const updateData: any = {}
    if (reminderFrequency) updateData.reminderFrequency = reminderFrequency
    if (preferredReminderDay !== undefined) updateData.preferredReminderDay = preferredReminderDay
    if (emailReminders !== undefined) updateData.receiveEmails = emailReminders
    if (smsReminders !== undefined) updateData.receiveSMS = smsReminders
    if (reminderAdvanceDays !== undefined) updateData.reminderAdvanceDays = reminderAdvanceDays

    const family = await Family.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, family })
  } catch (error: any) {
    console.error('Error updating reminder preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences', details: error.message },
      { status: 500 }
    )
  }
}
