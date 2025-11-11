import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { SavedPaymentMethod, Payment, Family, RecurringPayment } from '@/lib/models'
import Stripe from 'stripe'
import https from 'https'

// Create HTTPS agent that handles SSL certificates properly
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production',
})

// Initialize Stripe only when API key is available (lazy initialization)
function getStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(apiKey, {
    apiVersion: '2025-10-29.clover',
    httpAgent: httpsAgent,
  })
}

// POST - Charge a saved payment method
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const body = await request.json()
    const { savedPaymentMethodId, amount, paymentDate, year, type, notes, saveForFuture, memberId } = body

    if (!savedPaymentMethodId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Saved payment method ID and valid amount are required' },
        { status: 400 }
      )
    }

    // Get saved payment method
    const savedPaymentMethod = await SavedPaymentMethod.findById(savedPaymentMethodId)
    
    if (!savedPaymentMethod || savedPaymentMethod.familyId.toString() !== params.id) {
      return NextResponse.json(
        { error: 'Saved payment method not found' },
        { status: 404 }
      )
    }

    // Create payment intent with saved payment method
    const stripe = getStripe()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method: savedPaymentMethod.stripePaymentMethodId,
      confirm: true,
      description: `${type || 'membership'} payment for family ${params.id}`,
      metadata: {
        familyId: params.id,
        savedPaymentMethodId: savedPaymentMethodId
      }
    })

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: `Payment failed. Status: ${paymentIntent.status}` },
        { status: 400 }
      )
    }

    // Create payment record in database
    const paymentData: any = {
      familyId: params.id,
      amount: paymentIntent.amount / 100,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      year: year || new Date().getFullYear(),
      type: type || 'membership',
      paymentMethod: 'credit_card',
      ccInfo: {
        last4: savedPaymentMethod.last4,
        cardType: savedPaymentMethod.cardType,
        expiryMonth: savedPaymentMethod.expiryMonth.toString(),
        expiryYear: savedPaymentMethod.expiryYear.toString(),
        nameOnCard: savedPaymentMethod.nameOnCard || undefined
      },
      stripePaymentIntentId: paymentIntent.id,
      savedPaymentMethodId: savedPaymentMethodId,
      paymentFrequency: 'one-time',
      notes: notes || undefined
    }

    // Add memberId if provided (for member-specific payments)
    if (memberId) {
      paymentData.memberId = memberId
    }

    const payment = await Payment.create(paymentData)
    const paymentObj = payment.toObject ? payment.toObject() : payment

    // If monthly payment, create or update recurring payment
    let recurringPaymentId = undefined
    if (body.paymentFrequency === 'monthly') {
      const startDate = paymentDate ? new Date(paymentDate) : new Date()
      const nextPaymentDate = new Date(startDate)
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)

      // Check if recurring payment already exists
      const existingRecurring = await RecurringPayment.findOne({
        familyId: params.id,
        savedPaymentMethodId: savedPaymentMethodId,
        isActive: true
      })

      if (existingRecurring) {
        // Update existing recurring payment
        existingRecurring.amount = amount
        existingRecurring.nextPaymentDate = nextPaymentDate
        existingRecurring.isActive = true
        await existingRecurring.save()
        recurringPaymentId = existingRecurring._id.toString()
      } else {
        // Create new recurring payment
        const recurringPayment = await RecurringPayment.create({
          familyId: params.id,
          savedPaymentMethodId: savedPaymentMethodId,
          amount: amount,
          frequency: 'monthly',
          startDate: startDate,
          nextPaymentDate: nextPaymentDate,
          isActive: true,
          notes: notes || `Monthly ${type || 'membership'} payment`
        })
        recurringPaymentId = recurringPayment._id.toString()
      }

      // Update payment with recurring payment ID
      payment.recurringPaymentId = recurringPaymentId
      await payment.save()
    }

    return NextResponse.json({
      success: true,
      payment: paymentObj,
      recurringPaymentId: recurringPaymentId
    })
  } catch (error: any) {
    console.error('Error charging saved card:', error)
    return NextResponse.json(
      { error: 'Failed to charge saved card', details: error.message },
      { status: 500 }
    )
  }
}

