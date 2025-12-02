import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { RecurringPayment, Family } from '@/lib/models'

// GET - Get payment reminder statistics for today
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get user's families
    const userFamilies = await Family.find({ userId: user.userId }).select('_id').lean()
    const userFamilyIds = userFamilies.map(f => f._id)

    // Count reminders sent today (check lastReminderSent field)
    const remindersSentToday = await RecurringPayment.countDocuments({
      familyId: { $in: userFamilyIds },
      lastReminderSent: {
        $gte: today,
        $lt: tomorrow
      }
    })

    // Count upcoming payments (next 7 days)
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const upcomingPayments = await RecurringPayment.countDocuments({
      familyId: { $in: userFamilyIds },
      isActive: true,
      nextPaymentDate: {
        $gte: today,
        $lte: sevenDaysFromNow
      }
    })

    return NextResponse.json({
      success: true,
      remindersSentToday,
      upcomingPayments
    })
  } catch (error: any) {
    console.error('Error fetching reminder stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminder stats', details: error.message },
      { status: 500 }
    )
  }
}

