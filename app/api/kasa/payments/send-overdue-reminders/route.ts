import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { RecurringPayment, Family, AutomationSettings, User } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { calculateDaysOverdue, getOverdueLevel, updateOverdueStatus } from '@/lib/overdue-helpers'
import { sendPaymentReminderEmail } from '@/lib/email-helpers'
import { sendPaymentReminderSMS } from '@/lib/sms-helpers'

export const dynamic = 'force-dynamic'

// POST - Send escalating overdue reminders (7, 14, 30 days)
// Can be called manually (with auth) or by cron job (without auth)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // First, update overdue status for all payments
    await updateOverdueStatus()
    
    const user = getAuthenticatedUser(request)
    const mongoose = require('mongoose')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let adminUsers: any[] = []
    
    if (user) {
      // Manual trigger - process for this user only
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
    const reminderLevels = [7, 14, 30] // Days overdue thresholds

    for (const admin of adminUsers) {
      try {
        // Find all families for this admin
        const userFamilies = await Family.find({ userId: admin._id }).select('_id').lean()
        const userFamilyIds = userFamilies.map(f => f._id)
        
        // Find overdue recurring payments for these families
        const overduePayments = await RecurringPayment.find({
          isActive: true,
          isOverdue: true,
          familyId: { $in: userFamilyIds }
        })
          .populate('familyId', 'name email husbandCellPhone wifeCellPhone phone receiveEmails receiveSMS')
          .lean()

        let adminSent = 0
        let adminFailed = 0

        for (const recurringPayment of overduePayments) {
          const family = recurringPayment.familyId as any
          if (!family) continue

          const daysOverdue = calculateDaysOverdue(recurringPayment.nextPaymentDate)
          const currentLevel = getOverdueLevel(daysOverdue)
          
          // Check if we should send a reminder for this level
          // Only send if:
          // 1. Payment has reached a reminder threshold (7, 14, or 30 days)
          // 2. We haven't sent a reminder for this level yet
          // 3. At least 24 hours have passed since last reminder (to avoid spam)
          
          const shouldSendReminder = reminderLevels.some((threshold, index) => {
            const level = index + 1 // 1, 2, or 3
            const reachedThreshold = daysOverdue >= threshold && currentLevel >= level
            const notSentForLevel = (recurringPayment.reminderLevel || 0) < level
            const enoughTimePassed = !recurringPayment.lastReminderSent || 
              (today.getTime() - new Date(recurringPayment.lastReminderSent).getTime()) >= 24 * 60 * 60 * 1000
            
            return reachedThreshold && notSentForLevel && enoughTimePassed
          })

          if (!shouldSendReminder) continue

          // Determine which level reminder to send
          let reminderLevelToSend = 0
          for (let i = reminderLevels.length - 1; i >= 0; i--) {
            if (daysOverdue >= reminderLevels[i] && (recurringPayment.reminderLevel || 0) < (i + 1)) {
              reminderLevelToSend = i + 1
              break
            }
          }

          if (reminderLevelToSend === 0) continue

          try {
            // Send email reminder (if enabled and family wants emails)
            const shouldSendEmail = admin.automationSettings?.enablePaymentEmails !== false
            const familyWantsEmails = family.receiveEmails !== false
            
            if (shouldSendEmail && familyWantsEmails && family.email) {
              await sendPaymentReminderEmail(
                family.email,
                family.name,
                recurringPayment.amount,
                recurringPayment.nextPaymentDate,
                daysOverdue,
                admin.userId
              )
            }

            // Send SMS reminder (if enabled and family wants SMS)
            const shouldSendSMS = admin.automationSettings?.enablePaymentSMS === true
            const familyWantsSMS = family.receiveSMS !== false
            const phoneNumber = family.husbandCellPhone || family.wifeCellPhone || family.phone
            
            if (shouldSendSMS && familyWantsSMS && phoneNumber) {
              await sendPaymentReminderSMS(
                phoneNumber,
                family.name,
                recurringPayment.amount,
                recurringPayment.nextPaymentDate,
                daysOverdue,
                admin.userId
              )
            }

            // Update reminder tracking
            await RecurringPayment.findByIdAndUpdate(recurringPayment._id, {
              reminderLevel: reminderLevelToSend,
              lastReminderSent: today
            })

            adminSent++
            totalSent++
          } catch (error: any) {
            console.error(`Failed to send overdue reminder for payment ${recurringPayment._id}:`, error)
            adminFailed++
            totalFailed++
          }
        }
      } catch (error: any) {
        console.error(`Error processing overdue reminders for admin ${admin.userId}:`, error)
        totalFailed++
      }
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
      failed: totalFailed,
      message: `Sent ${totalSent} overdue reminders, ${totalFailed} failed`
    })
  } catch (error: any) {
    console.error('Error sending overdue reminders:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send overdue reminders', 
        details: error.message,
        sent: 0,
        failed: 0
      },
      { status: 500 }
    )
  }
}

