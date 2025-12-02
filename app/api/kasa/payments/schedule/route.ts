import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Payment, Family, ScheduledPayment } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - Schedule future payment
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { familyId, amount, scheduledDate, paymentMethod, notes, autoProcess } = body

    if (!familyId || !amount || !scheduledDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const scheduledDateObj = new Date(scheduledDate)
    if (scheduledDateObj <= new Date()) {
      return NextResponse.json({ error: 'Scheduled date must be in the future' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)
    const familyIdObj = new mongoose.Types.ObjectId(familyId)

    const scheduledPayment = await ScheduledPayment.create({
      userId,
      familyId: familyIdObj,
      amount,
      scheduledDate: scheduledDateObj,
      paymentMethod: paymentMethod || 'cash',
      notes,
      autoProcess: autoProcess || false,
      status: 'scheduled'
    })

    return NextResponse.json({
      success: true,
      scheduledPayment
    })
  } catch (error: any) {
    console.error('Error scheduling payment:', error)
    return NextResponse.json(
      { error: 'Failed to schedule payment', details: error.message },
      { status: 500 }
    )
  }
}

