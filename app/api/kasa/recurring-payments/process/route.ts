import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { RecurringPayment, SavedPaymentMethod, Payment } from '@/lib/models'
import Stripe from 'stripe'
import https from 'https'

// Create HTTPS agent that handles SSL certificates properly
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production',
})

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
  httpAgent: httpsAgent,
})

// POST - Process all due recurring payments
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find all active recurring payments that are due
    const duePayments = await RecurringPayment.find({
      isActive: true,
      nextPaymentDate: { $lte: today }
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

        // Charge the saved payment method
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
        })

        if (paymentIntent.status !== 'succeeded') {
          results.push({
            recurringPaymentId: recurringPayment._id.toString(),
            familyName: family?.name || 'Unknown',
            status: 'failed',
            error: `Payment failed. Status: ${paymentIntent.status}`
          })
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
        results.push({
          recurringPaymentId: recurringPayment._id.toString(),
          familyName: (recurringPayment.familyId as any)?.name || 'Unknown',
          status: 'failed',
          error: error.message || 'Unknown error'
        })
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

