import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { PaymentLink, Family, Payment } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get payment link details (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    await connectDB()
    
    const link = await PaymentLink.findOne({
      linkId: params.linkId,
      isActive: true
    })
      .populate('familyId', 'name email')
      .lean()

    if (!link) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }

    // Check if expired
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Payment link has expired' }, { status: 410 })
    }

    // Check if max uses reached
    if (link.maxUses && link.currentUses >= link.maxUses) {
      return NextResponse.json({ error: 'Payment link has reached maximum uses' }, { status: 410 })
    }

    return NextResponse.json({
      ...link,
      _id: link._id.toString(),
      familyId: (link.familyId as any)?._id?.toString(),
      familyName: (link.familyId as any)?.name
    })
  } catch (error: any) {
    console.error('Error fetching payment link:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment link', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Process payment via link (public endpoint)
export async function POST(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { amount, paymentMethod, paymentData } = body

    const link = await PaymentLink.findOne({
      linkId: params.linkId,
      isActive: true
    })
      .populate('familyId')
      .lean()

    if (!link) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }

    // Check if expired
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Payment link has expired' }, { status: 410 })
    }

    // Check if max uses reached
    if (link.maxUses && link.currentUses >= link.maxUses) {
      return NextResponse.json({ error: 'Payment link has reached maximum uses' }, { status: 410 })
    }

    const family = link.familyId as any
    const finalAmount = link.amount || amount

    if (!finalAmount || finalAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Process payment based on method
    let stripePaymentIntentId: string | undefined
    if (paymentMethod === 'credit_card' && paymentData?.paymentIntentId) {
      stripePaymentIntentId = paymentData.paymentIntentId
    }

    // Create payment record
    const mongoose = require('mongoose')
    const payment = await Payment.create({
      familyId: family._id,
      amount: finalAmount,
      paymentDate: new Date(),
      year: new Date().getFullYear(),
      type: 'membership',
      paymentMethod: paymentMethod || 'credit_card',
      paymentLinkId: link._id,
      stripePaymentIntentId,
      notes: `Payment via link: ${link.description || ''}`
    })

    // Update link usage
    await PaymentLink.findByIdAndUpdate(link._id, {
      $inc: { currentUses: 1 }
    })

    // Update payment analytics
    const { PaymentAnalytics } = await import('@/lib/models')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    await PaymentAnalytics.findOneAndUpdate(
      {
        userId: link.userId,
        date: today
      },
      {
        $inc: {
          totalPayments: 1,
          totalAmount: finalAmount,
          successfulPayments: 1,
          [`paymentMethods.${paymentMethod || 'credit_card'}.count`]: 1,
          [`paymentMethods.${paymentMethod || 'credit_card'}.amount`]: finalAmount
        }
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({
      success: true,
      payment: {
        _id: payment._id.toString(),
        amount: finalAmount,
        paymentDate: payment.paymentDate
      }
    })
  } catch (error: any) {
    console.error('Error processing payment:', error)
    return NextResponse.json(
      { error: 'Failed to process payment', details: error.message },
      { status: 500 }
    )
  }
}

