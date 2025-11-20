import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { 
  LifecycleEventPayment, 
  Task, 
  Payment, 
  RecurringPayment,
  Family,
  FamilyMember
} from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  type: 'lifecycle_event' | 'task' | 'payment' | 'recurring_payment' | 'wedding' | 'bar_mitzvah' | 'bat_mitzvah'
  color: string
  familyId?: string
  familyName?: string
  memberId?: string
  memberName?: string
  amount?: number
  status?: string
  url?: string
  description?: string
}

// GET - Get all calendar events for a date range
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

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start') // ISO date string
    const endDate = searchParams.get('end') // ISO date string

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Check permission - users with calendar.view see all, others see only their families
    const canViewAll = await hasPermission(user, PERMISSIONS.CALENDAR_VIEW)
    
    // Build query for user's families
    let familyQuery: any = {}
    if (!canViewAll) {
      const userFamilies = await Family.find({ userId: user.userId }).select('_id')
      const userFamilyIds = userFamilies.map(f => f._id)
      familyQuery = { familyId: { $in: userFamilyIds } }
    }

    const events: CalendarEvent[] = []

    // 1. Lifecycle Events
    const lifecycleEvents = await LifecycleEventPayment.find({
      ...familyQuery,
      eventDate: { $gte: start, $lte: end }
    })
      .populate('familyId', 'name')
      .lean()

    for (const event of lifecycleEvents) {
      const eventDoc = event as any
      const eventTypeLabels: { [key: string]: string } = {
        'chasena': 'Wedding',
        'bar_mitzvah': 'Bar Mitzvah',
        'bat_mitzvah': 'Bat Mitzvah',
        'birth_boy': 'Birth (Boy)',
        'birth_girl': 'Birth (Girl)'
      }
      
      const eventColors: { [key: string]: string } = {
        'chasena': '#e91e63',
        'bar_mitzvah': '#2196f3',
        'bat_mitzvah': '#9c27b0',
        'birth_boy': '#4caf50',
        'birth_girl': '#ff9800'
      }

      const familyName = eventDoc.familyId?.name || 'Unknown Family'
      
      events.push({
        id: `lifecycle_${eventDoc._id}`,
        title: `${eventTypeLabels[eventDoc.eventType] || eventDoc.eventType} - ${familyName}`,
        start: new Date(eventDoc.eventDate).toISOString(),
        type: 'lifecycle_event',
        color: eventColors[eventDoc.eventType] || '#757575',
        familyId: String(eventDoc.familyId?._id || eventDoc.familyId),
        familyName,
        amount: eventDoc.amount,
        description: eventDoc.notes,
        url: `/families/${eventDoc.familyId?._id || eventDoc.familyId}`
      })
    }

    // 2. Tasks
    const tasks = await Task.find({
      userId: user.userId,
      dueDate: { $gte: start, $lte: end }
    }).lean()

    for (const task of tasks) {
      const taskDoc = task as any
      const statusColors: { [key: string]: string } = {
        'pending': '#ff9800',
        'in_progress': '#2196f3',
        'completed': '#4caf50',
        'cancelled': '#757575'
      }

      events.push({
        id: `task_${taskDoc._id}`,
        title: taskDoc.title,
        start: new Date(taskDoc.dueDate).toISOString(),
        type: 'task',
        color: statusColors[taskDoc.status] || '#757575',
        status: taskDoc.status,
        description: taskDoc.description,
        url: '/tasks'
      })
    }

    // 3. Payments
    const payments = await Payment.find({
      ...familyQuery,
      paymentDate: { $gte: start, $lte: end }
    })
      .populate('familyId', 'name')
      .lean()

    for (const payment of payments) {
      const paymentDoc = payment as any
      const familyName = paymentDoc.familyId?.name || 'Unknown Family'
      
      events.push({
        id: `payment_${paymentDoc._id}`,
        title: `Payment - ${familyName}`,
        start: new Date(paymentDoc.paymentDate).toISOString(),
        type: 'payment',
        color: '#4caf50',
        familyId: String(paymentDoc.familyId?._id || paymentDoc.familyId),
        familyName,
        amount: paymentDoc.amount,
        description: `Payment: $${paymentDoc.amount} - ${paymentDoc.paymentMethod}`,
        url: `/families/${paymentDoc.familyId?._id || paymentDoc.familyId}`
      })
    }

    // 4. Recurring Payments (upcoming)
    const recurringPayments = await RecurringPayment.find({
      ...familyQuery,
      isActive: true,
      nextPaymentDate: { $gte: start, $lte: end }
    })
      .populate('familyId', 'name')
      .lean()

    for (const recurring of recurringPayments) {
      const recurringDoc = recurring as any
      const familyName = recurringDoc.familyId?.name || 'Unknown Family'
      
      events.push({
        id: `recurring_${recurringDoc._id}`,
        title: `Recurring Payment - ${familyName}`,
        start: new Date(recurringDoc.nextPaymentDate).toISOString(),
        type: 'recurring_payment',
        color: '#00bcd4',
        familyId: String(recurringDoc.familyId?._id || recurringDoc.familyId),
        familyName,
        amount: recurringDoc.amount,
        description: `Recurring payment: $${recurringDoc.amount} - ${recurringDoc.frequency}`,
        url: `/families/${recurringDoc.familyId?._id || recurringDoc.familyId}`
      })
    }

    // 5. Upcoming Weddings (from members)
    const weddingQuery: any = {
      weddingDate: { $gte: start, $lte: end, $ne: null }
    }
    if (!isAdmin(user) && familyQuery.familyId) {
      weddingQuery.familyId = familyQuery.familyId
    }
    const upcomingWeddings = await FamilyMember.find(weddingQuery)
      .populate('familyId', 'name')
      .lean()

    for (const member of upcomingWeddings) {
      const memberDoc = member as any
      const familyName = memberDoc.familyId?.name || 'Unknown Family'
      
      events.push({
        id: `wedding_${memberDoc._id}`,
        title: `Wedding - ${memberDoc.firstName} ${memberDoc.lastName}`,
        start: new Date(memberDoc.weddingDate).toISOString(),
        type: 'wedding',
        color: '#e91e63',
        familyId: String(memberDoc.familyId?._id || memberDoc.familyId),
        familyName,
        memberId: String(memberDoc._id),
        memberName: `${memberDoc.firstName} ${memberDoc.lastName}`,
        description: `Wedding date for ${memberDoc.firstName} ${memberDoc.lastName}`,
        url: `/families/${memberDoc.familyId?._id || memberDoc.familyId}`
      })
    }

    // 6. Bar/Bat Mitzvahs
    const barMitzvahQuery: any = {
      $or: [
        { barMitzvahDate: { $gte: start, $lte: end, $ne: null } },
        { batMitzvahDate: { $gte: start, $lte: end, $ne: null } }
      ]
    }
    if (!isAdmin(user) && familyQuery.familyId) {
      barMitzvahQuery.familyId = familyQuery.familyId
    }
    const barMitzvahs = await FamilyMember.find(barMitzvahQuery)
      .populate('familyId', 'name')
      .lean()

    for (const member of barMitzvahs) {
      const memberDoc = member as any
      const familyName = memberDoc.familyId?.name || 'Unknown Family'
      const isBarMitzvah = memberDoc.barMitzvahDate && 
        new Date(memberDoc.barMitzvahDate) >= start && 
        new Date(memberDoc.barMitzvahDate) <= end
      const isBatMitzvah = memberDoc.batMitzvahDate && 
        new Date(memberDoc.batMitzvahDate) >= start && 
        new Date(memberDoc.batMitzvahDate) <= end

      if (isBarMitzvah) {
        events.push({
          id: `bar_mitzvah_${memberDoc._id}`,
          title: `Bar Mitzvah - ${memberDoc.firstName} ${memberDoc.lastName}`,
          start: new Date(memberDoc.barMitzvahDate).toISOString(),
          type: 'bar_mitzvah',
          color: '#2196f3',
          familyId: String(memberDoc.familyId?._id || memberDoc.familyId),
          familyName,
          memberId: String(memberDoc._id),
          memberName: `${memberDoc.firstName} ${memberDoc.lastName}`,
          description: `Bar Mitzvah for ${memberDoc.firstName} ${memberDoc.lastName}`,
          url: `/families/${memberDoc.familyId?._id || memberDoc.familyId}`
        })
      }

      if (isBatMitzvah) {
        events.push({
          id: `bat_mitzvah_${memberDoc._id}`,
          title: `Bat Mitzvah - ${memberDoc.firstName} ${memberDoc.lastName}`,
          start: new Date(memberDoc.batMitzvahDate).toISOString(),
          type: 'bat_mitzvah',
          color: '#9c27b0',
          familyId: String(memberDoc.familyId?._id || memberDoc.familyId),
          familyName,
          memberId: String(memberDoc._id),
          memberName: `${memberDoc.firstName} ${memberDoc.lastName}`,
          description: `Bat Mitzvah for ${memberDoc.firstName} ${memberDoc.lastName}`,
          url: `/families/${memberDoc.familyId?._id || memberDoc.familyId}`
        })
      }
    }

    return NextResponse.json({ events })
  } catch (error: any) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar events', details: error.message },
      { status: 500 }
    )
  }
}

