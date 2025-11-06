import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import connectDB from '@/lib/database'
import { Payment } from '@/lib/models'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { paymentIntentId, familyId, paymentDate, year, type, notes } = body

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: `Payment not succeeded. Status: ${paymentIntent.status}` },
        { status: 400 }
      )
    }

    // Get payment method details
    let ccInfo: any = undefined
    if (paymentIntent.payment_method) {
      const paymentMethod = await stripe.paymentMethods.retrieve(
        paymentIntent.payment_method as string
      )
      
      if (paymentMethod.card) {
        ccInfo = {
          last4: paymentMethod.card.last4,
          cardType: paymentMethod.card.brand,
          expiryMonth: paymentMethod.card.exp_month?.toString(),
          expiryYear: paymentMethod.card.exp_year?.toString(),
          nameOnCard: paymentMethod.billing_details?.name || undefined
        }
      }
    }

    // Create payment record in database
    const paymentData: any = {
      familyId: familyId,
      amount: paymentIntent.amount / 100, // Convert from cents to dollars
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      year: year || new Date().getFullYear(),
      type: type || 'membership',
      paymentMethod: 'credit_card',
      ccInfo: ccInfo,
      notes: notes || undefined,
      stripePaymentIntentId: paymentIntent.id,
    }

    const payment = await Payment.create(paymentData)
    const paymentObj = payment.toObject ? payment.toObject() : payment

    return NextResponse.json({
      success: true,
      payment: paymentObj,
    })
  } catch (error: any) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}

