import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Payment, Invoice } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get unmatched payments and invoices
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Get payments without invoice matches
    const payments = await Payment.find({
      userId,
      invoiceId: { $exists: false }
    })
      .populate('familyId', 'name')
      .sort({ paymentDate: -1 })
      .lean()

    // Get invoices without payment matches or partially paid
    const invoices = await Invoice.find({
      userId,
      $or: [
        { paidAmount: { $lt: '$total' } },
        { paidAmount: { $exists: false } }
      ]
    })
      .populate('familyId', 'name')
      .sort({ dueDate: -1 })
      .lean()

    return NextResponse.json({
      payments,
      invoices
    })
  } catch (error: any) {
    console.error('Error fetching unmatched:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unmatched', details: error.message },
      { status: 500 }
    )
  }
}

