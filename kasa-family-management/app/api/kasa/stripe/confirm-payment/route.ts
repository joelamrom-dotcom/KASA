import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import https from 'https'
import connectDB from '@/lib/database'
import { Payment, RecurringPayment, SavedPaymentMethod } from '@/lib/models'

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set in environment variables')
}

// Create HTTPS agent that handles SSL certificates properly
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production',
})

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  httpAgent: httpsAgent,
}) : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      console.error('Stripe is not initialized - STRIPE_SECRET_KEY missing')
      return NextResponse.json(
        { error: 'Stripe is not configured. Please check server environment variables.' },
        { status: 500 }
      )
    }

    await connectDB()
    const body = await request.json()
    const { paymentIntentId, familyId, paymentDate, year, type, notes, paymentFrequency, savedPaymentMethodId } = body

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
    let actualSavedPaymentMethodId = savedPaymentMethodId

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

        // If payment method should be saved but wasn't saved yet, save it now
        if (!actualSavedPaymentMethodId && savedPaymentMethodId === 'will_be_saved') {
          try {
            // Unset other defaults for this family
            await SavedPaymentMethod.updateMany(
              { familyId: familyId },
              { isDefault: false }
            )

            // Save the payment method
            const saved = await SavedPaymentMethod.create({
              familyId: familyId,
              stripePaymentMethodId: paymentMethod.id,
              last4: paymentMethod.card.last4,
              cardType: paymentMethod.card.brand,
              expiryMonth: paymentMethod.card.exp_month || 0,
              expiryYear: paymentMethod.card.exp_year || 0,
              nameOnCard: paymentMethod.billing_details?.name || undefined,
              isDefault: true,
              isActive: true
            })
            actualSavedPaymentMethodId = saved._id.toString()
          } catch (err) {
            console.error('Error saving payment method:', err)
          }
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
      paymentFrequency: paymentFrequency || 'one-time',
      savedPaymentMethodId: actualSavedPaymentMethodId || undefined,
    }

    const payment = await Payment.create(paymentData)
    const paymentObj = payment.toObject ? payment.toObject() : payment

    // If monthly payment and payment method was saved, create recurring payment
    let recurringPaymentId = undefined
    if (paymentFrequency === 'monthly' && actualSavedPaymentMethodId) {
      const startDate = paymentDate ? new Date(paymentDate) : new Date()
      const nextPaymentDate = new Date(startDate)
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)

      // Check if recurring payment already exists
      const existingRecurring = await RecurringPayment.findOne({
        familyId: familyId,
        savedPaymentMethodId: actualSavedPaymentMethodId,
        isActive: true
      })

      if (existingRecurring) {
        // Update existing recurring payment
        existingRecurring.amount = paymentObj.amount
        existingRecurring.nextPaymentDate = nextPaymentDate
        existingRecurring.isActive = true
        await existingRecurring.save()
        recurringPaymentId = existingRecurring._id.toString()
      } else {
        // Create new recurring payment
        const recurringPayment = await RecurringPayment.create({
          familyId: familyId,
          savedPaymentMethodId: actualSavedPaymentMethodId,
          amount: paymentObj.amount,
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
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}

