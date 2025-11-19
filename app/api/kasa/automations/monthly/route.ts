import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { AutomationSettings, User } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

// POST - Run all monthly automations (statement generation and emails)
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
      
      // Filter to only admins with statement automations enabled
      for (const admin of allAdmins) {
        const adminId = admin._id as any
        if (!adminId) continue
        
        const automationSettings = await AutomationSettings.findOne({ userId: adminId })
        if (automationSettings && (
          automationSettings.enableStatementGeneration ||
          automationSettings.enableStatementEmails
        )) {
          adminUsers.push({ _id: adminId, userId: adminId.toString() })
        }
      }
    }

    if (adminUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No admins with monthly automations enabled',
        results: {}
      })
    }

    const results: any = {
      statementGeneration: { generated: 0 },
      statementEmails: { sent: 0, failed: 0 }
    }

    // Generate statements
    try {
      const generateRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/kasa/statements/auto-generate`, {
        method: 'POST',
        headers: request.headers
      })
      if (generateRes.ok) {
        const generateData = await generateRes.json()
        results.statementGeneration = {
          generated: generateData.generated || 0
        }
      }
    } catch (error: any) {
      console.error('Error generating statements:', error)
    }

    // Send statement emails
    try {
      const emailsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/kasa/statements/send-monthly-emails`, {
        method: 'POST',
        headers: request.headers
      })
      if (emailsRes.ok) {
        const emailsData = await emailsRes.json()
        results.statementEmails = {
          sent: emailsData.sent || 0,
          failed: emailsData.failed || 0
        }
      }
    } catch (error: any) {
      console.error('Error sending statement emails:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Monthly automations completed',
      results
    })
  } catch (error: any) {
    console.error('Error running monthly automations:', error)
    return NextResponse.json(
      { error: 'Failed to run monthly automations', details: error.message },
      { status: 500 }
    )
  }
}

