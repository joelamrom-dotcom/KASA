import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Payment, Invoice } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - Auto-match payments to invoices
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Get unmatched payments
    const payments = await Payment.find({
      userId,
      invoiceId: { $exists: false }
    }).lean()

    // Get unpaid invoices
    const invoices = await Invoice.find({
      userId,
      $or: [
        { paidAmount: { $lt: '$total' } },
        { paidAmount: { $exists: false } }
      ]
    }).lean()

    const matches: any[] = []

    for (const payment of payments) {
      // Find matching invoice by family and amount
      const matchingInvoice = invoices.find((inv: any) => 
        inv.familyId.toString() === payment.familyId.toString() &&
        Math.abs(inv.total - payment.amount) < 0.01 &&
        (!inv.paidAmount || inv.paidAmount < inv.total)
      )

      if (matchingInvoice) {
        await Payment.findByIdAndUpdate(payment._id, {
          invoiceId: matchingInvoice._id
        })

        const newPaidAmount = ((matchingInvoice as any).paidAmount || 0) + payment.amount
        await Invoice.findByIdAndUpdate(matchingInvoice._id, {
          paidAmount: newPaidAmount,
          status: newPaidAmount >= matchingInvoice.total ? 'paid' : 'sent'
        })

        matches.push({
          paymentId: payment._id,
          invoiceId: matchingInvoice._id
        })
      }
    }

    return NextResponse.json({
      success: true,
      matches: matches.length,
      details: matches
    })
  } catch (error: any) {
    console.error('Error auto-matching:', error)
    return NextResponse.json(
      { error: 'Failed to auto-match', details: error.message },
      { status: 500 }
    )
  }
}

