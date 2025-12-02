import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { RecurringPayment, Family } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get recurring payments
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const families = await Family.find({ userId }).select('_id').lean()
    const familyIds = families.map((f: any) => f._id)

    const recurringPayments = await RecurringPayment.find({
      familyId: { $in: familyIds }
    })
      .populate('familyId', 'name email')
      .sort({ nextPaymentDate: 1 })
      .lean()

    return NextResponse.json({ recurringPayments })
  } catch (error: any) {
    console.error('Error fetching recurring payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring payments', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create recurring payment
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { familyId, savedPaymentMethodId, amount, frequency, startDate, notes } = body

    if (!familyId || !savedPaymentMethodId || !amount || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const recurringPayment = await RecurringPayment.create({
      familyId,
      savedPaymentMethodId,
      amount,
      frequency: frequency || 'monthly',
      startDate: new Date(startDate),
      nextPaymentDate: new Date(startDate),
      isActive: true,
      notes
    })

    return NextResponse.json({ recurringPayment })
  } catch (error: any) {
    console.error('Error creating recurring payment:', error)
    return NextResponse.json(
      { error: 'Failed to create recurring payment', details: error.message },
      { status: 500 }
    )
  }
}

