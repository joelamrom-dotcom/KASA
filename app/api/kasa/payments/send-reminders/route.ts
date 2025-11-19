import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { RecurringPayment, Family, AutomationSettings, User } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

// POST - Send payment reminders for upcoming payments
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
      const userObjectId = new mongoose.Types.ObjectId(user.userId)
      const automationSettings = await AutomationSettings.findOne({ userId: userObjectId })
      
      if (!automationSettings || !automationSettings.enablePaymentReminders) {
        return NextResponse.json({
          success: false,
          message: 'Payment reminders automation is disabled for this account',
          sent: 0,
          failed: 0
        })
      }
      
      adminUsers = [{ _id: userObjectId, userId: user.userId, automationSettings }]
    } else {
      // Cron job trigger - process for all admins with reminders enabled
      const allAdmins = await User.find({ 
        role: { $in: ['admin', 'super_admin'] },
        isActive: true 
      }).select('_id').lean()
      
      // Filter to only admins with reminders enabled
      for (const admin of allAdmins) {
        const adminId = admin._id as any
        if (!adminId) continue
        
        const automationSettings = await AutomationSettings.findOne({ 
          userId: adminId,
          enablePaymentReminders: true 
        })
        if (automationSettings) {
          adminUsers.push({ _id: adminId, userId: adminId.toString(), automationSettings })
        }
      }
    }

    if (adminUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No admins with payment reminders enabled',
        sent: 0,
        failed: 0
      })
    }

    let totalSent = 0
    let totalFailed = 0
    const allResults: any[] = []

    for (const admin of adminUsers) {
      try {
        const reminderDays = admin.automationSettings?.reminderDaysBefore || [3, 1]
        
        // Find all families for this admin
        const userFamilies = await Family.find({ userId: admin._id }).select('_id').lean()
        const userFamilyIds = userFamilies.map(f => f._id)
        
        // Find recurring payments for these families
        const recurringPayments = await RecurringPayment.find({
          isActive: true,
          familyId: { $in: userFamilyIds }
        }).populate('familyId', 'name email husbandCellPhone wifeCellPhone phone')
          .lean()

        let adminSent = 0
        let adminFailed = 0

        for (const recurringPayment of recurringPayments) {
          const family = recurringPayment.familyId as any
          if (!family) continue

          const nextPaymentDate = new Date(recurringPayment.nextPaymentDate)
          nextPaymentDate.setHours(0, 0, 0, 0)
          
          // Check if we should send a reminder today
          for (const daysBefore of reminderDays) {
            const reminderDate = new Date(nextPaymentDate)
            reminderDate.setDate(reminderDate.getDate() - daysBefore)
            reminderDate.setHours(0, 0, 0, 0)
            
            // Only send if today matches the reminder date and payment hasn't been processed yet
            if (reminderDate.getTime() === today.getTime() && nextPaymentDate >= today) {
              try {
                // Send email reminder
                if (family.email) {
                  const { sendPaymentReminderEmail } = await import('@/lib/email-helpers')
                  await sendPaymentReminderEmail(
                    family.email,
                    family.name,
                    recurringPayment.amount,
                    nextPaymentDate,
                    daysBefore,
                    admin.userId
                  )
                }

                // Send SMS reminder
                const phoneNumber = family.husbandCellPhone || family.wifeCellPhone || family.phone
                if (phoneNumber && admin.automationSettings?.enablePaymentSMS) {
                  const { sendPaymentReminderSMS } = await import('@/lib/sms-helpers')
                  await sendPaymentReminderSMS(
                    phoneNumber,
                    family.name,
                    recurringPayment.amount,
                    nextPaymentDate,
                    daysBefore,
                    admin.userId
                  )
                }

                allResults.push({
                  adminId: admin.userId,
                  familyId: family._id?.toString(),
                  familyName: family.name,
                  amount: recurringPayment.amount,
                  dueDate: nextPaymentDate.toISOString(),
                  daysBefore,
                  status: 'sent'
                })
                adminSent++

              } catch (error: any) {
                console.error(`Error sending reminder for family ${family.name}:`, error)
                allResults.push({
                  adminId: admin.userId,
                  familyId: family._id?.toString(),
                  familyName: family.name,
                  status: 'failed',
                  error: error.message
                })
                adminFailed++
              }
              break // Only send one reminder per day
            }
          }
        }
        
        totalSent += adminSent
        totalFailed += adminFailed

      } catch (adminError: any) {
        console.error(`Error processing reminders for admin ${admin.userId}:`, adminError)
        totalFailed++
        allResults.push({
          adminId: admin.userId,
          status: 'failed',
          error: adminError.message || 'Unknown error processing admin reminders'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${totalSent} reminders, ${totalFailed} failed across all enabled admins`,
      sent: totalSent,
      failed: totalFailed,
      results: allResults
    })
  } catch (error: any) {
    console.error('Error sending payment reminders:', error)
    return NextResponse.json(
      { error: 'Failed to send payment reminders', details: error.message },
      { status: 500 }
    )
  }
}

