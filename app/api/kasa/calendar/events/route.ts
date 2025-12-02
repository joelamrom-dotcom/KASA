import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, LifecycleEventPayment, Task } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get calendar events
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const families = await Family.find({ userId }).select('_id').lean()
    const familyIds = families.map((f: any) => f._id)

    const events: any[] = []

    // Get lifecycle events
    const lifecycleEvents = await LifecycleEventPayment.find({
      familyId: { $in: familyIds },
      ...(startDate && endDate ? {
        eventDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      } : {})
    }).populate('familyId', 'name').lean()

    lifecycleEvents.forEach((event: any) => {
      events.push({
        id: event._id.toString(),
        title: `${event.eventType} - ${event.familyId?.name || 'Unknown'}`,
        start: new Date(event.eventDate).toISOString(),
        type: 'lifecycle',
        familyId: event.familyId?._id.toString(),
        amount: event.amount
      })
    })

    // Get tasks
    const tasks = await Task.find({
      userId,
      ...(startDate && endDate ? {
        dueDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      } : {})
    }).lean()

    tasks.forEach((task: any) => {
      events.push({
        id: task._id.toString(),
        title: task.title,
        start: new Date(task.dueDate).toISOString(),
        type: 'task',
        isCompleted: task.isCompleted
      })
    })

    return NextResponse.json({ events })
  } catch (error: any) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events', details: error.message },
      { status: 500 }
    )
  }
}
