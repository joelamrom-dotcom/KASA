import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Payment, Family } from '@/lib/models'

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

    // Create scheduled payment (would need ScheduledPayment schema)
    // For now, create a payment with future date and status 'scheduled'
    const payment = await Payment.create({
      familyId,
      amount,
      paymentDate: scheduledDateObj,
      year: scheduledDateObj.getFullYear(),
      type: 'membership',
      paymentMethod: paymentMethod || 'cash',
      notes: `${notes || ''} (Scheduled payment)`.trim(),
      // Add status field if schema supports it
    })

    return NextResponse.json({
      success: true,
      payment,
      scheduledDate: scheduledDateObj,
      autoProcess: autoProcess || false
    })
  } catch (error: any) {
    console.error('Error scheduling payment:', error)
    return NextResponse.json(
      { error: 'Failed to schedule payment', details: error.message },
      { status: 500 }
    )
  }
}

