import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { AutomationSettings, User } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

// POST - Run all daily automations (payments, wedding conversion, task emails)
// Can be called manually (with auth) or by cron job (without auth)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    const mongoose = require('mongoose')
    
    let adminUsers: any[] = []
    
    if (user) {
      // Manual trigger - process for this user only
      adminUsers = [{ _id: new mongoose.Types.ObjectId(user.userId), userId: user.userId }]
    } else {
      // Cron job trigger - process for all admins with automations enabled
      const allAdmins = await User.find({ 
        role: { $in: ['admin', 'super_admin'] },
        isActive: true 
      }).select('_id').lean()
      
      // Filter to only admins with at least one automation enabled
      for (const admin of allAdmins) {
        const adminId = admin._id as any
        if (!adminId) continue
        
        const automationSettings = await AutomationSettings.findOne({ userId: adminId })
        if (automationSettings && (
          automationSettings.enableMonthlyPayments ||
          automationSettings.enableWeddingConversion ||
          automationSettings.enableTaskEmails ||
          automationSettings.enablePaymentReminders
        )) {
          adminUsers.push({ _id: adminId, userId: adminId.toString() })
        }
      }
    }

    if (adminUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No admins with daily automations enabled',
        results: {}
      })
    }

    const results: any = {
      monthlyPayments: { processed: 0, failed: 0 },
      weddingConversion: { converted: 0 },
      taskEmails: { sent: 0, failed: 0 },
      paymentReminders: { sent: 0, failed: 0 }
    }

    // Get base URL from request or environment
    const baseUrl = request.nextUrl.origin || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Process monthly payments
    try {
      const paymentsRes = await fetch(`${baseUrl}/api/kasa/recurring-payments/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json()
        results.monthlyPayments = {
          processed: paymentsData.processed || 0,
          failed: paymentsData.failed || 0
        }
      }
    } catch (error: any) {
      console.error('Error processing monthly payments:', error)
    }

    // Process wedding conversion
    try {
      const weddingRes = await fetch(`${baseUrl}/api/kasa/wedding-converter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (weddingRes.ok) {
        const weddingData = await weddingRes.json()
        results.weddingConversion = {
          converted: weddingData.converted || 0
        }
      }
    } catch (error: any) {
      console.error('Error processing wedding conversion:', error)
    }

    // Process task emails
    try {
      const tasksRes = await fetch(`${baseUrl}/api/kasa/tasks/send-due-date-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        results.taskEmails = {
          sent: tasksData.sent || 0,
          failed: tasksData.failed || 0
        }
      }
    } catch (error: any) {
      console.error('Error processing task emails:', error)
    }

    // Process payment reminders
    try {
      const remindersRes = await fetch(`${baseUrl}/api/kasa/payments/send-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (remindersRes.ok) {
        const remindersData = await remindersRes.json()
        results.paymentReminders = {
          sent: remindersData.sent || 0,
          failed: remindersData.failed || 0
        }
      }
    } catch (error: any) {
      console.error('Error processing payment reminders:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Daily automations completed',
      results
    })
  } catch (error: any) {
    console.error('Error running daily automations:', error)
    return NextResponse.json(
      { error: 'Failed to run daily automations', details: error.message },
      { status: 500 }
    )
  }
}

