import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Payment, Refund, Family, AutomationSettings } from '@/lib/models'
import { getUserStripe, getUserStripeAccountId } from '@/lib/stripe-helpers'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'
import { sendRefundConfirmationEmail } from '@/lib/refund-email'

export const dynamic = 'force-dynamic'

// POST - Process a refund for a payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.PAYMENTS_REFUND))) {
      return NextResponse.json(
        { error: 'Forbidden - Refund permission required' },
        { status: 403 }
      )
    }
    
    const payment = await Payment.findById(params.id).populate('familyId')
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }
    
    // Check if payment belongs to user's families (unless user has global refund permission)
    const family = payment.familyId as any
    const canRefundAll = await hasPermission(user, PERMISSIONS.PAYMENTS_REFUND)
    
    // If user doesn't have global refund permission, check ownership
    if (!canRefundAll && family.userId?.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this payment' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { amount, reason, notes } = body
    
    // Validate refund amount
    const refundAmount = parseFloat(amount)
    if (!refundAmount || refundAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid refund amount' },
        { status: 400 }
      )
    }
    
    // Check if payment can be refunded
    const alreadyRefunded = payment.refundedAmount || 0
    const remainingAmount = payment.amount - alreadyRefunded
    
    if (refundAmount > remainingAmount) {
      return NextResponse.json(
        { error: `Refund amount ($${refundAmount}) exceeds remaining amount ($${remainingAmount})` },
        { status: 400 }
      )
    }
    
    // Only process Stripe refunds if payment has a Stripe payment intent
    let stripeRefundId: string | null = null
    let refundStatus = 'succeeded'
    let failureReason: string | undefined = undefined
    
    if (payment.stripePaymentIntentId && payment.paymentMethod === 'credit_card') {
      try {
        // Get user's Stripe account
        const stripe = await getUserStripe(family.userId?.toString() || user.userId)
        const accountId = await getUserStripeAccountId(family.userId?.toString() || user.userId)
        
        if (!stripe || !accountId) {
          return NextResponse.json(
            { error: 'Stripe account not connected. Cannot process refund for Stripe payment.' },
            { status: 400 }
          )
        }
        
        // Retrieve the payment intent to get the charge ID
        const paymentIntent = await stripe.paymentIntents.retrieve(
          payment.stripePaymentIntentId,
          { stripeAccount: accountId }
        )
        
        const chargeId = paymentIntent.latest_charge as string
        
        if (!chargeId) {
          return NextResponse.json(
            { error: 'Charge ID not found for this payment' },
            { status: 400 }
          )
        }
        
        // Create refund in Stripe
        // Map our reason to Stripe's reason format
        let stripeReason: 'fraudulent' | 'duplicate' | undefined = undefined
        if (reason === 'fraudulent') {
          stripeReason = 'fraudulent'
        } else if (reason === 'duplicate') {
          stripeReason = 'duplicate'
        }
        
        const refund = await stripe.refunds.create({
          charge: chargeId,
          amount: Math.round(refundAmount * 100), // Convert to cents
          reason: stripeReason,
          metadata: {
            paymentId: params.id,
            familyId: family._id.toString(),
            refundedBy: user.userId,
            notes: notes || ''
          }
        }, {
          stripeAccount: accountId
        })
        
        stripeRefundId = refund.id
        refundStatus = refund.status === 'succeeded' ? 'succeeded' : refund.status === 'pending' ? 'pending' : 'failed'
        
        if (refund.status === 'failed') {
          failureReason = refund.failure_reason || 'Unknown failure reason'
        }
      } catch (stripeError: any) {
        console.error('Stripe refund error:', stripeError)
        return NextResponse.json(
          { error: `Failed to process Stripe refund: ${stripeError.message}` },
          { status: 500 }
        )
      }
    } else if (payment.paymentMethod === 'credit_card' && !payment.stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'Cannot refund: Payment does not have a Stripe payment intent ID' },
        { status: 400 }
      )
    }
    // For non-Stripe payments (cash, check), we can still track the refund in our system
    
    // Create refund record
    const refund = await Refund.create({
      paymentId: params.id,
      familyId: family._id,
      amount: refundAmount,
      refundDate: new Date(),
      reason: reason || 'requested_by_customer',
      notes: notes || undefined,
      refundedBy: user.userId,
      refundedByEmail: user.email,
      stripeRefundId: stripeRefundId || undefined,
      stripeChargeId: payment.stripePaymentIntentId || undefined,
      status: refundStatus,
      failureReason: failureReason || undefined
    })
    
    // Update payment refund tracking
    const newRefundedAmount = alreadyRefunded + refundAmount
    payment.refundedAmount = newRefundedAmount
    payment.isFullyRefunded = newRefundedAmount >= payment.amount
    payment.isPartiallyRefunded = newRefundedAmount > 0 && newRefundedAmount < payment.amount
    await payment.save()
    
    // Create audit log entry
    await auditLogFromRequest(request, user, 'payment_refund', 'payment', {
      entityId: params.id,
      entityName: `Refund of $${refundAmount}`,
      description: `Processed refund of $${refundAmount} for payment of $${payment.amount}${reason ? ` - Reason: ${reason}` : ''}`,
      metadata: {
        paymentId: params.id,
        familyId: family._id.toString(),
        familyName: family.name,
        refundAmount,
        originalAmount: payment.amount,
        reason,
        stripeRefundId,
        refundStatus,
      }
    })
    
    // Send refund confirmation email (if enabled and family wants emails)
    try {
      const mongoose = require('mongoose')
      const adminObjectId = new mongoose.Types.ObjectId(family.userId || user.userId)
      const automationSettings = await AutomationSettings.findOne({ userId: adminObjectId })
      
      const shouldSendEmail = automationSettings?.enablePaymentEmails !== false
      const familyWantsEmails = family.receiveEmails !== false
      
      if (shouldSendEmail && familyWantsEmails && family.email) {
        await sendRefundConfirmationEmail(
          family.email,
          family.name,
          refundAmount,
          payment.amount,
          new Date(payment.paymentDate),
          reason || 'requested_by_customer',
          notes,
          user.email || 'Admin'
        )
        console.log(`✅ Refund confirmation email sent to ${family.email}`)
      }
    } catch (emailError: any) {
      console.error('Error sending refund confirmation email:', emailError)
      // Don't fail refund if email fails
    }
    
    return NextResponse.json({
      success: true,
      refund: {
        _id: refund._id,
        amount: refundAmount,
        status: refundStatus,
        stripeRefundId,
        refundDate: refund.refundDate
      },
      payment: {
        refundedAmount: newRefundedAmount,
        isFullyRefunded: payment.isFullyRefunded,
        isPartiallyRefunded: payment.isPartiallyRefunded
      }
    })
  } catch (error: any) {
    console.error('Error processing refund:', error)
    return NextResponse.json(
      { error: 'Failed to process refund', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Get refund history for a payment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.PAYMENTS_VIEW))) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    const payment = await Payment.findById(params.id).populate('familyId')
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }
    
    // Check if payment belongs to user's families
    const canViewAll = await hasPermission(user, PERMISSIONS.PAYMENTS_VIEW)
    const family = payment.familyId as any
    if (!canViewAll && family.userId?.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this payment' },
        { status: 403 }
      )
    }
    
    const refunds = await Refund.find({ paymentId: params.id })
      .populate('refundedBy', 'email name')
      .sort({ refundDate: -1 })
      .lean()
    
    return NextResponse.json({ refunds })
  } catch (error: any) {
    console.error('Error fetching refunds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch refunds', details: error.message },
      { status: 500 }
    )
  }
}

