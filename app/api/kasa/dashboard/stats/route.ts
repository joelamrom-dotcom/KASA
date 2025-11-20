import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, FamilyMember, Payment, LifecycleEvent, Task } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') || 'month'

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    if (range === 'week') {
      startDate.setDate(now.getDate() - 7)
    } else if (range === 'month') {
      startDate.setMonth(now.getMonth() - 1)
    } else if (range === 'year') {
      startDate.setFullYear(now.getFullYear() - 1)
    }

    // Total Families
    const totalFamilies = await Family.countDocuments({ userId })

    // Total Members
    const totalMembers = await FamilyMember.countDocuments({ userId })

    // Total Income (from payments)
    const payments = await Payment.find({
      userId,
      date: { $gte: startDate }
    })

    const totalIncome = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)

    // Total Expenses (from lifecycle events)
    const events = await LifecycleEvent.find({
      userId,
      date: { $gte: startDate }
    })

    const totalExpenses = events.reduce((sum, event) => sum + (event.amount || 0), 0)
    const balance = totalIncome - totalExpenses

    // Monthly breakdown (last 6 months)
    const monthlyIncome: number[] = []
    const monthlyExpenses: number[] = []
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthPayments = payments.filter(p => {
        const paymentDate = new Date(p.date)
        return paymentDate >= monthStart && paymentDate <= monthEnd
      })
      const monthEvents = events.filter(e => {
        const eventDate = new Date(e.date)
        return eventDate >= monthStart && eventDate <= monthEnd
      })
      
      monthlyIncome.push(monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0))
      monthlyExpenses.push(monthEvents.reduce((sum, e) => sum + (e.amount || 0), 0))
    }

    // Payment methods breakdown
    const paymentMethodCounts: Record<string, number> = {}
    payments.forEach(payment => {
      const method = payment.paymentMethod || 'other'
      paymentMethodCounts[method] = (paymentMethodCounts[method] || 0) + (payment.amount || 0)
    })

    const paymentMethods = Object.entries(paymentMethodCounts).map(([name, value]) => ({
      name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
      color: getColorForPaymentMethod(name)
    }))

    // Upcoming events (next 30 days)
    const upcomingEventsDate = new Date()
    upcomingEventsDate.setDate(now.getDate() + 30)
    
    const upcomingEvents = await LifecycleEvent.find({
      userId,
      date: { $gte: now, $lte: upcomingEventsDate }
    })
      .populate('familyId', 'name')
      .sort({ date: 1 })
      .limit(10)
      .select('eventType date familyId')
      .lean()

    const upcomingEventsFormatted = upcomingEvents.map((event: any) => ({
      _id: event._id.toString(),
      eventType: event.eventType,
      date: event.date,
      familyName: event.familyId?.name || 'Unknown'
    }))

    // Overdue payments
    const overduePayments = await Payment.countDocuments({
      userId,
      dueDate: { $lt: now },
      status: { $ne: 'paid' }
    })

    return NextResponse.json({
      totalFamilies,
      totalMembers,
      totalIncome,
      totalExpenses,
      balance,
      monthlyIncome,
      monthlyExpenses,
      paymentMethods,
      upcomingEvents: upcomingEventsFormatted,
      overduePayments,
      recentActivity: [] // Can be populated with recent activity
    })
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error.message },
      { status: 500 }
    )
  }
}

function getColorForPaymentMethod(method: string): string {
  const colors: Record<string, string> = {
    cash: '#10b981',
    credit_card: '#3b82f6',
    check: '#8b5cf6',
    quick_pay: '#f59e0b',
    ach: '#06b6d4',
    wire_transfer: '#ef4444',
    other: '#6b7280'
  }
  return colors[method] || colors.other
}

