import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Payment, SavedPaymentMethod, RecurringPayment, Family } from '@/lib/models'
import { createPaymentDeclinedTask } from '@/lib/task-helpers'
import { getUserStripe, getUserStripeAccountId } from '@/lib/stripe-helpers'
import { getAuthenticatedUser } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get user's Stripe account
    const stripe = await getUserStripe(user.userId)
    const accountId = await getUserStripeAccountId(user.userId)
    
    if (!stripe || !accountId) {
      return NextResponse.json(
        { error: 'Stripe account not connected. Please connect your Stripe account in Settings.' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { paymentIntentId, familyId, paymentDate, year, type, notes, paymentFrequency, savedPaymentMethodId, memberId } = body

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    // Retrieve the payment intent from Stripe (using user's connected account)
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      stripeAccount: accountId
    })

    if (paymentIntent.status !== 'succeeded') {
      const errorMsg = `Payment not succeeded. Status: ${paymentIntent.status}`
      
      // Create task for declined payment
      await createPaymentDeclinedTask(
        familyId,
        null,
        paymentIntent.amount / 100, // Convert from cents
        errorMsg,
        memberId
      )
      
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      )
    }

    // Get payment method details
    let ccInfo: any = undefined
    let actualSavedPaymentMethodId = savedPaymentMethodId

    if (paymentIntent.payment_method) {
      const paymentMethod = await stripe.paymentMethods.retrieve(
        paymentIntent.payment_method as string,
        {
          stripeAccount: accountId
        }
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

    // Add memberId if provided (for member-specific payments)
    if (memberId) {
      paymentData.memberId = memberId
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

    // Send payment confirmation email
    try {
      const family = await Family.findById(familyId)
      if (family && family.email) {
        const { sendPaymentConfirmationEmail } = await import('@/lib/email-helpers')
        
        // Format payment method for display
        let paymentMethodDisplay = 'Credit Card'
        if (ccInfo) {
          paymentMethodDisplay = `${ccInfo.cardType || 'Credit Card'} ending in ${ccInfo.last4 || '****'}`
        }
        
        await sendPaymentConfirmationEmail(
          family.email,
          family.name,
          paymentObj.amount,
          new Date(paymentObj.paymentDate),
          paymentMethodDisplay,
          paymentObj._id?.toString(),
          notes
        )
        console.log(`✅ Payment confirmation email sent to ${family.email}`)
      }
    } catch (emailError: any) {
      // Log error but don't fail payment creation if email sending fails
      console.error(`⚠️ Failed to send payment confirmation email:`, emailError.message)
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

