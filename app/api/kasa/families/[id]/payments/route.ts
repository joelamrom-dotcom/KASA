import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Payment, Family } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'

// GET - Get all payments for a family
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    // Get authenticated user
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if family exists and user has access
    const family = await Family.findById(params.id)
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }
    
    // Check permission or ownership
    const canViewAll = await hasPermission(user, PERMISSIONS.PAYMENTS_VIEW)
    const isFamilyOwner = family.userId?.toString() === user.userId
    const isFamilyMember = user.role === 'family' && user.familyId === params.id
    
    if (!canViewAll && !isFamilyOwner && !isFamilyMember) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this family' },
        { status: 403 }
      )
    }
    
    const payments = await Payment.find({ familyId: params.id }).sort({ paymentDate: -1 })
    
    // Log payment methods to debug
    console.log(`Fetched ${payments.length} payments for family ${params.id}`)
    payments.forEach((payment: any, index: number) => {
      const paymentObj = payment.toObject ? payment.toObject() : payment
      console.log(`Payment ${index + 1}:`, {
        _id: paymentObj._id,
        amount: paymentObj.amount,
        paymentMethod: paymentObj.paymentMethod,
        hasCcInfo: !!paymentObj.ccInfo,
        hasCheckInfo: !!paymentObj.checkInfo
      })
    })
    
    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Add a new payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    // Get authenticated user
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if family exists and user has access
    const family = await Family.findById(params.id)
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }
    
    // Check permission or ownership
    const canViewAll = await hasPermission(user, PERMISSIONS.PAYMENTS_VIEW)
    const isFamilyOwner = family.userId?.toString() === user.userId
    const isFamilyMember = user.role === 'family' && user.familyId === params.id
    
    if (!canViewAll && !isFamilyOwner && !isFamilyMember) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this family' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { amount, paymentDate, year, type, paymentMethod, ccInfo, checkInfo, notes, memberId } = body

    console.log('Received payment data:', { amount, paymentDate, year, type, paymentMethod, ccInfo, checkInfo })

    if (amount === undefined || amount === null || !paymentDate || !year) {
      return NextResponse.json(
        { error: 'Amount, payment date, and year are required' },
        { status: 400 }
      )
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Ensure paymentMethod is set correctly (default to cash only if truly missing)
    const finalPaymentMethod = paymentMethod && paymentMethod !== '' ? paymentMethod : 'cash'
    
    console.log('Payment method processing:', {
      received: paymentMethod,
      type: typeof paymentMethod,
      final: finalPaymentMethod
    })

    const paymentData: any = {
      familyId: params.id,
      amount: parseFloat(amount),
      paymentDate: new Date(paymentDate),
      year: parseInt(year),
      type: type || 'membership',
      paymentMethod: finalPaymentMethod,
      notes: notes || undefined
    }

    // Add memberId if provided (for member-specific payments)
    if (memberId) {
      paymentData.memberId = memberId
    }
    
    console.log('Payment data before adding ccInfo/checkInfo:', JSON.stringify(paymentData, null, 2))

    // Add credit card info if provided
    if (finalPaymentMethod === 'credit_card' && ccInfo) {
      console.log('Adding ccInfo for credit_card payment')
      paymentData.ccInfo = ccInfo
    } else if (finalPaymentMethod === 'credit_card') {
      console.log('WARNING: credit_card selected but no ccInfo provided')
    }

    // Add check info if provided
    if (finalPaymentMethod === 'check' && checkInfo) {
      console.log('Adding checkInfo for check payment')
      paymentData.checkInfo = checkInfo
    } else if (finalPaymentMethod === 'check') {
      console.log('WARNING: check selected but no checkInfo provided')
    }

    console.log('Final payment data being saved:', JSON.stringify(paymentData, null, 2))
    console.log('PaymentMethod value in paymentData:', paymentData.paymentMethod)

    const payment = await Payment.create(paymentData)
    
    // Convert to plain object to ensure all fields are included
    const paymentObj = payment.toObject ? payment.toObject() : payment
    
    // Create audit log entry
    await auditLogFromRequest(request, user, 'payment_create', 'payment', {
      entityId: paymentObj._id.toString(),
      entityName: `Payment of $${amount}`,
      description: `Created payment of $${amount} for family "${family.name}"`,
      metadata: {
        familyId: params.id,
        familyName: family.name,
        amount,
        paymentMethod: finalPaymentMethod,
        paymentDate: new Date(paymentDate),
        type: type || 'membership',
      }
    })
    
    console.log('Payment created successfully:', {
      _id: paymentObj._id,
      paymentMethod: paymentObj.paymentMethod,
      amount: paymentObj.amount,
      hasCcInfo: !!paymentObj.ccInfo,
      ccInfo: paymentObj.ccInfo,
      fullPaymentObject: JSON.stringify(paymentObj, null, 2)
    })

    // Send payment confirmation email (if enabled in settings)
    try {
      const family = await Family.findById(params.id)
      if (family && family.email && family.userId) {
        // Check if payment emails are enabled for this admin
        const { AutomationSettings } = await import('@/lib/models')
        const mongoose = require('mongoose')
        const adminObjectId = new mongoose.Types.ObjectId(family.userId)
        const automationSettings = await AutomationSettings.findOne({ userId: adminObjectId })
        
        const shouldSendEmail = automationSettings?.enablePaymentEmails !== false // Default to true if not set
        const familyWantsEmails = family.receiveEmails !== false // Default to true if not set
        
        if (shouldSendEmail && familyWantsEmails) {
          const { sendPaymentConfirmationEmail } = await import('@/lib/email-helpers')
          
          // Format payment method for display
          let paymentMethodDisplay = paymentObj.paymentMethod || 'Unknown'
          if (paymentMethodDisplay === 'credit_card' && paymentObj.ccInfo) {
            paymentMethodDisplay = `${paymentObj.ccInfo.cardType || 'Credit Card'} ending in ${paymentObj.ccInfo.last4 || '****'}`
          } else if (paymentMethodDisplay === 'credit_card') {
            paymentMethodDisplay = 'Credit Card'
          } else if (paymentMethodDisplay === 'check' && paymentObj.checkInfo) {
            paymentMethodDisplay = `Check (****${paymentObj.checkInfo.accountNumber?.slice(-4) || '****'})`
          }
          
          await sendPaymentConfirmationEmail(
            family.email,
            family.name,
            paymentObj.amount,
            new Date(paymentObj.paymentDate),
            paymentMethodDisplay,
            paymentObj._id?.toString(),
            paymentObj.notes
          )
          console.log(`✅ Payment confirmation email sent to ${family.email}`)
        } else {
          if (!shouldSendEmail) {
            console.log(`ℹ️ Payment confirmation email skipped - disabled in automation settings for admin ${family.userId}`)
          } else if (!familyWantsEmails) {
            console.log(`ℹ️ Payment confirmation email skipped - family has opted out of emails`)
          }
        }
      }
    } catch (emailError: any) {
      // Log error but don't fail payment creation if email sending fails
      console.error(`⚠️ Failed to send payment confirmation email:`, emailError.message)
    }

    // Send payment confirmation SMS (if enabled in settings)
    try {
      if (family && family.userId) {
        const { AutomationSettings } = await import('@/lib/models')
        const mongoose = require('mongoose')
        const adminObjectId = new mongoose.Types.ObjectId(family.userId)
        const automationSettings = await AutomationSettings.findOne({ userId: adminObjectId })
        
        const shouldSendSMS = automationSettings?.enablePaymentSMS === true
        const familyWantsSMS = family.receiveSMS !== false // Default to true if not set
        
        if (shouldSendSMS && familyWantsSMS) {
          // Get phone number from family (prefer husbandCellPhone, then wifeCellPhone, then phone)
          const phoneNumber = family.husbandCellPhone || family.wifeCellPhone || family.phone
          
          if (phoneNumber) {
            const { sendPaymentConfirmationSMS } = await import('@/lib/sms-helpers')
            
            // Format payment method for display
            let paymentMethodDisplay = paymentObj.paymentMethod || 'Unknown'
            if (paymentMethodDisplay === 'credit_card' && paymentObj.ccInfo) {
              paymentMethodDisplay = `${paymentObj.ccInfo.cardType || 'Credit Card'} ending in ${paymentObj.ccInfo.last4 || '****'}`
            } else if (paymentMethodDisplay === 'credit_card') {
              paymentMethodDisplay = 'Credit Card'
            } else if (paymentMethodDisplay === 'check' && paymentObj.checkInfo) {
              paymentMethodDisplay = `Check (****${paymentObj.checkInfo.accountNumber?.slice(-4) || '****'})`
            }
            
            await sendPaymentConfirmationSMS(
              phoneNumber,
              family.name,
              paymentObj.amount,
              new Date(paymentObj.paymentDate),
              paymentMethodDisplay,
              family.userId.toString()
            )
            console.log(`✅ Payment confirmation SMS sent to ${phoneNumber}`)
          }
        }
      }
    } catch (smsError: any) {
      // Log error but don't fail payment creation if SMS sending fails
      console.error(`⚠️ Failed to send payment confirmation SMS:`, smsError.message)
    }

    // Send thank you email (separate from confirmation)
    try {
      if (family && family.email && family.userId) {
        const { AutomationSettings } = await import('@/lib/models')
        const mongoose = require('mongoose')
        const adminObjectId = new mongoose.Types.ObjectId(family.userId)
        const automationSettings = await AutomationSettings.findOne({ userId: adminObjectId })
        
        // Send thank you if payment emails are enabled and family wants emails
        const shouldSendThankYouEmail = automationSettings?.enablePaymentEmails !== false && family.receiveEmails !== false
        if (shouldSendThankYouEmail) {
          const { sendPaymentThankYouEmail } = await import('@/lib/email-helpers')
          await sendPaymentThankYouEmail(
            family.email,
            family.name,
            paymentObj.amount,
            family.userId.toString()
          )
          console.log(`✅ Thank you email sent to ${family.email}`)
        }
      }
    } catch (thankYouError: any) {
      console.error(`⚠️ Failed to send thank you email:`, thankYouError.message)
    }

    // Send thank you SMS (separate from confirmation)
    try {
      if (family && family.userId) {
        const { AutomationSettings } = await import('@/lib/models')
        const mongoose = require('mongoose')
        const adminObjectId = new mongoose.Types.ObjectId(family.userId)
        const automationSettings = await AutomationSettings.findOne({ userId: adminObjectId })
        
        const shouldSendThankYouSMS = automationSettings?.enablePaymentSMS === true && family.receiveSMS !== false
        if (shouldSendThankYouSMS) {
          const phoneNumber = family.husbandCellPhone || family.wifeCellPhone || family.phone
          if (phoneNumber) {
            const { sendPaymentThankYouSMS } = await import('@/lib/sms-helpers')
            await sendPaymentThankYouSMS(
              phoneNumber,
              family.name,
              paymentObj.amount,
              family.userId.toString()
            )
            console.log(`✅ Thank you SMS sent to ${phoneNumber}`)
          }
        }
      }
    } catch (thankYouSmsError: any) {
      console.error(`⚠️ Failed to send thank you SMS:`, thankYouSmsError.message)
    }

    // Auto-send receipt (if enabled and family wants emails)
    try {
      if (family && family.email && family.userId) {
        const { AutomationSettings } = await import('@/lib/models')
        const mongoose = require('mongoose')
        const adminObjectId = new mongoose.Types.ObjectId(family.userId)
        const automationSettings = await AutomationSettings.findOne({ userId: adminObjectId })
        
        const shouldAutoSendReceipt = automationSettings?.enablePaymentEmails !== false && family.receiveEmails !== false
        if (shouldAutoSendReceipt) {
          // Call receipt endpoint with autoSend=true
          const baseUrl = request.nextUrl.origin || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
            process.env.NEXT_PUBLIC_BASE_URL || 
            'http://localhost:3000'
          
          try {
            const receiptRes = await fetch(`${baseUrl}/api/kasa/payments/${paymentObj._id.toString()}/receipt?autoSend=true`, {
              method: 'GET',
              headers: {
                'Authorization': request.headers.get('Authorization') || ''
              }
            })
            if (receiptRes.ok) {
              console.log(`✅ Receipt auto-sent to ${family.email}`)
            }
          } catch (receiptError: any) {
            console.error(`⚠️ Failed to auto-send receipt:`, receiptError.message)
            // Don't fail payment creation if receipt sending fails
          }
        }
      }
    } catch (receiptError: any) {
      console.error(`⚠️ Failed to auto-send receipt:`, receiptError.message)
      // Don't fail payment creation if receipt sending fails
    }

    return NextResponse.json(paymentObj, { status: 201 })
  } catch (error: any) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment', details: error.message },
      { status: 500 }
    )
  }
}

