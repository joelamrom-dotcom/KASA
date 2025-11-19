import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { RecurringPayment, SavedPaymentMethod, Payment, Family, AutomationSettings, User } from '@/lib/models'
import { createPaymentDeclinedTask } from '@/lib/task-helpers'
import { getUserStripe, getUserStripeAccountId } from '@/lib/stripe-helpers'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'

// POST - Process all due recurring payments
// Can be called manually (with auth) or by cron job (without auth)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    const mongoose = require('mongoose')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let adminUsers: any[] = []
    
    if (user) {
      // Manual trigger - process for this user only if automation is enabled
      if (!isAdmin(user)) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 401 }
        )
      }
      
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
      
      adminUsers = [{ _id: userObjectId, userId: user.userId }]
    } else {
      // Cron job trigger - process for all admins with automation enabled
      const allAdmins = await User.find({ 
        role: { $in: ['admin', 'super_admin'] },
        isActive: true 
      }).select('_id').lean()
      
      // Filter to only admins with automation enabled
      for (const admin of allAdmins) {
        const adminId = admin._id as any
        if (!adminId) continue
        
        const automationSettings = await AutomationSettings.findOne({ 
          userId: adminId,
          enableMonthlyPayments: true 
        })
        if (automationSettings) {
          adminUsers.push({ _id: adminId, userId: adminId.toString() })
        }
      }
    }

    if (adminUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No admins with monthly payments automation enabled',
        processed: 0,
        skipped: 0,
        failed: 0
      })
    }

    // Process payments for each admin
    let totalProcessed = 0
    let totalFailed = 0
    const allResults: any[] = []

    for (const admin of adminUsers) {
      try {
        // Get admin's Stripe account
        const stripe = await getUserStripe(admin.userId)
        const accountId = await getUserStripeAccountId(admin.userId)
        
        if (!stripe || !accountId) {
          console.log(`Skipping admin ${admin.userId} - Stripe not connected`)
          continue
        }

        // Find all active recurring payments that are due for this admin's families
        const userFamilies = await Family.find({ userId: admin._id }).select('_id').lean()
        const userFamilyIds = userFamilies.map(f => f._id)
        
        const duePayments = await RecurringPayment.find({
          isActive: true,
          nextPaymentDate: { $lte: today },
          familyId: { $in: userFamilyIds }
        }).populate('familyId', 'name email')
          .populate('savedPaymentMethodId')

        if (duePayments.length === 0) {
          continue // No payments due for this admin
        }

        let adminProcessed = 0
        let adminFailed = 0

        for (const recurringPayment of duePayments) {
          try {
            const savedPaymentMethod = recurringPayment.savedPaymentMethodId as any
            const family = recurringPayment.familyId as any

            if (!savedPaymentMethod || !savedPaymentMethod.isActive) {
              allResults.push({
                adminId: admin.userId,
                recurringPaymentId: recurringPayment._id.toString(),
                familyName: family?.name || 'Unknown',
                status: 'failed',
                error: 'Saved payment method not found or inactive'
              })
              adminFailed++
              continue
            }

            // Charge the saved payment method using admin's Stripe account
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
              allResults.push({
                adminId: admin.userId,
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
              
              adminFailed++
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

            // Send payment confirmation email
            try {
              if (family && family.email) {
                const { sendPaymentConfirmationEmail } = await import('@/lib/email-helpers')
                
                const paymentMethodDisplay = `${savedPaymentMethod.cardType || 'Credit Card'} ending in ${savedPaymentMethod.last4 || '****'}`
                
                await sendPaymentConfirmationEmail(
                  family.email,
                  family.name,
                  recurringPayment.amount,
                  paymentDate,
                  paymentMethodDisplay,
                  payment._id.toString(),
                  `Automatic monthly payment - ${recurringPayment.notes || ''}`
                )
                console.log(`✅ Payment confirmation email sent to ${family.email}`)
              }
            } catch (emailError: any) {
              // Log error but don't fail payment processing if email sending fails
              console.error(`⚠️ Failed to send payment confirmation email:`, emailError.message)
            }

            allResults.push({
              adminId: admin.userId,
              recurringPaymentId: recurringPayment._id.toString(),
              familyName: family?.name || 'Unknown',
              status: 'success',
              paymentId: payment._id.toString(),
              amount: recurringPayment.amount,
              nextPaymentDate: nextPaymentDate.toISOString()
            })
            adminProcessed++

          } catch (error: any) {
            console.error(`Error processing recurring payment ${recurringPayment._id}:`, error)
            const errorMsg = error.message || 'Unknown error'
            const family = recurringPayment.familyId as any
            allResults.push({
              adminId: admin.userId,
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
            
            adminFailed++
          }
        }

        totalProcessed += adminProcessed
        totalFailed += adminFailed

      } catch (error: any) {
        console.error(`Error processing payments for admin ${admin.userId}:`, error)
        // Continue with next admin
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${totalProcessed} payments, ${totalFailed} failed across ${adminUsers.length} admin(s)`,
      processed: totalProcessed,
      failed: totalFailed,
      adminsProcessed: adminUsers.length,
      results: allResults
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
