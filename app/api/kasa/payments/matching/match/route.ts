import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Payment, Invoice } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - Manually match payment to invoice
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { paymentId, invoiceId } = body

    if (!paymentId || !invoiceId) {
      return NextResponse.json({ error: 'Payment ID and Invoice ID are required' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const paymentIdObj = new mongoose.Types.ObjectId(paymentId)
    const invoiceIdObj = new mongoose.Types.ObjectId(invoiceId)

    const payment = await Payment.findById(paymentIdObj)
    const invoice = await Invoice.findById(invoiceIdObj)

    if (!payment || !invoice) {
      return NextResponse.json({ error: 'Payment or invoice not found' }, { status: 404 })
    }

    // Link payment to invoice
    await Payment.findByIdAndUpdate(paymentIdObj, {
      invoiceId: invoiceIdObj
    })

    // Update invoice paid amount
    const newPaidAmount = (invoice.paidAmount || 0) + payment.amount
    await Invoice.findByIdAndUpdate(invoiceIdObj, {
      paidAmount: newPaidAmount,
      status: newPaidAmount >= invoice.total ? 'paid' : 'sent',
      paidAt: newPaidAmount >= invoice.total ? new Date() : invoice.paidAt
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error matching payment:', error)
    return NextResponse.json(
      { error: 'Failed to match payment', details: error.message },
      { status: 500 }
    )
  }
}

