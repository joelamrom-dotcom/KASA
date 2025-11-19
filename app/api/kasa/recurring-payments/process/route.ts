import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { RecurringPayment, SavedPaymentMethod, Payment, Family, AutomationSettings } from '@/lib/models'
import { createPaymentDeclinedTask } from '@/lib/task-helpers'
import { getUserStripe, getUserStripeAccountId } from '@/lib/stripe-helpers'
import { getAuthenticatedUser } from '@/lib/middleware'

// POST - Process all due recurring payments
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
    
    // Check if automation is enabled for this user
    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)
    const automationSettings = await AutomationSettings.findOne({ userId: userObjectId })
    
    if (automationSettings && !automationSettings.enableMonthlyPayments) {
      return NextResponse.json({
        success: false,
        message: 'Monthly payments automation is disabled for this account',
        processed: 0,
        skipped: 0,
        failed: 0
      })
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
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find all active recurring payments that are due for this user's families
    const userFamilies = await Family.find({ userId: user.userId }).select('_id').lean()
    const userFamilyIds = userFamilies.map(f => f._id)
    
    const duePayments = await RecurringPayment.find({
      isActive: true,
      nextPaymentDate: { $lte: today },
      familyId: { $in: userFamilyIds } // Only process payments for user's families
    }).populate('familyId', 'name email')
      .populate('savedPaymentMethodId')

    if (duePayments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No recurring payments due',
        processed: 0,
        failed: 0,
        results: []
      })
    }

    const results = []
    let processed = 0
    let failed = 0

    for (const recurringPayment of duePayments) {
      try {
        const savedPaymentMethod = recurringPayment.savedPaymentMethodId as any
        const family = recurringPayment.familyId as any

        if (!savedPaymentMethod || !savedPaymentMethod.isActive) {
          results.push({
            recurringPaymentId: recurringPayment._id.toString(),
            familyName: family?.name || 'Unknown',
            status: 'failed',
            error: 'Saved payment method not found or inactive'
          })
          failed++
          continue
        }

        // Charge the saved payment method using user's Stripe account
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(recurringPayment.amount * 100), // Convert to cents
          currency: 'usd',
          payment_method: savedPaymentMethod.stripePaymentMethodId,
          confirm: true,
          description: `Monthly recurring payment for ${family?.name || 'family'}`,
          metadata: {
            familyId: family?._id?.toString() || '',
            recurringPaymentId: recurringPayment._id.toString()
          }
        }, {
          stripeAccount: accountId // Use connected account
        })

        if (paymentIntent.status !== 'succeeded') {
          const errorMsg = `Payment failed. Status: ${paymentIntent.status}`
          results.push({
            recurringPaymentId: recurringPayment._id.toString(),
            familyName: family?.name || 'Unknown',
            status: 'failed',
            error: errorMsg
          })
          
          // Create task for declined payment
          await createPaymentDeclinedTask(
            family?._id?.toString() || '',
            null,
            recurringPayment.amount,
            errorMsg
          )
          
          failed++
          continue
        }

        // Create payment record
        const paymentDate = new Date()
        const payment = await Payment.create({
          familyId: recurringPayment.familyId,
          amount: recurringPayment.amount,
          paymentDate: paymentDate,
          year: paymentDate.getFullYear(),
          type: 'membership',
          paymentMethod: 'credit_card',
          ccInfo: {
            last4: savedPaymentMethod.last4,
            cardType: savedPaymentMethod.cardType,
            expiryMonth: savedPaymentMethod.expiryMonth.toString(),
            expiryYear: savedPaymentMethod.expiryYear.toString(),
            nameOnCard: savedPaymentMethod.nameOnCard || undefined
          },
          stripePaymentIntentId: paymentIntent.id,
          savedPaymentMethodId: savedPaymentMethod._id,
          recurringPaymentId: recurringPayment._id,
          paymentFrequency: 'monthly',
          notes: `Automatic monthly payment - ${recurringPayment.notes || ''}`
        })

        // Update next payment date (add 1 month)
        const nextPaymentDate = new Date(recurringPayment.nextPaymentDate)
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)
        recurringPayment.nextPaymentDate = nextPaymentDate
        await recurringPayment.save()

        results.push({
          recurringPaymentId: recurringPayment._id.toString(),
          familyName: family?.name || 'Unknown',
          status: 'success',
          paymentId: payment._id.toString(),
          amount: recurringPayment.amount,
          nextPaymentDate: nextPaymentDate.toISOString()
        })
        processed++

      } catch (error: any) {
        console.error(`Error processing recurring payment ${recurringPayment._id}:`, error)
        const errorMsg = error.message || 'Unknown error'
        results.push({
          recurringPaymentId: recurringPayment._id.toString(),
          familyName: (recurringPayment.familyId as any)?.name || 'Unknown',
          status: 'failed',
          error: errorMsg
        })
        
        // Create task for declined payment
        const family = recurringPayment.familyId as any
        await createPaymentDeclinedTask(
          family?._id?.toString() || '',
          null,
          recurringPayment.amount,
          errorMsg
        )
        
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} payments, ${failed} failed`,
      processed,
      failed,
      results
    })
  } catch (error: any) {
    console.error('Error processing recurring payments:', error)
    return NextResponse.json(
      { error: 'Failed to process recurring payments', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Get all recurring payments
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const familyId = searchParams.get('familyId')
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const query: any = {}
    if (familyId) query.familyId = familyId
    if (activeOnly) query.isActive = true

    const recurringPayments = await RecurringPayment.find(query)
      .populate('familyId', 'name email')
      .populate('savedPaymentMethodId')
      .sort({ nextPaymentDate: 1 })

    return NextResponse.json(recurringPayments)
  } catch (error: any) {
    console.error('Error fetching recurring payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring payments', details: error.message },
      { status: 500 }
    )
  }
}

