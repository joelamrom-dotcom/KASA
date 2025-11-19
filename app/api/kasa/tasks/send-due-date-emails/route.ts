import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Task, EmailConfig, AutomationSettings } from '@/lib/models'
import nodemailer from 'nodemailer'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// POST - Send emails for tasks due today
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Check if automation is enabled (if user is authenticated)
    try {
      const user = getAuthenticatedUser(request)
      if (user) {
        const mongoose = require('mongoose')
        const userObjectId = new mongoose.Types.ObjectId(user.userId)
        const automationSettings = await AutomationSettings.findOne({ userId: userObjectId })
        
        if (automationSettings && !automationSettings.enableTaskEmails) {
          return NextResponse.json({
            success: false,
            message: 'Task email automation is disabled for this account',
            sent: 0,
            failed: 0
          })
        }
      }
    } catch (authError) {
      // If no auth, continue (cron jobs may not have auth)
    }
    
    // Get email configuration
    const emailConfig = await EmailConfig.findOne({ isActive: true })
    if (!emailConfig) {
      return NextResponse.json(
        { error: 'Email configuration not found. Please configure email settings first.' },
        { status: 400 }
      )
    }

    // Find tasks due today that haven't been sent yet
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const tasksDueToday = await Task.find({
      dueDate: { $gte: today, $lt: tomorrow },
      emailSent: false,
      status: { $ne: 'completed' }
    })
      .populate('relatedFamilyId', 'name')
      .populate('relatedMemberId', 'firstName lastName')
      .lean()

    if (tasksDueToday.length === 0) {
      return NextResponse.json({
        message: 'No tasks due today that need email notifications',
        sent: 0,
        failed: 0
      })
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfig.email,
        pass: emailConfig.password
      }
    })

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Send email for each task
    for (const task of tasksDueToday) {
      try {
        const relatedInfo = []
        if (task.relatedFamilyId && typeof task.relatedFamilyId === 'object' && 'name' in task.relatedFamilyId) {
          relatedInfo.push(`Family: ${task.relatedFamilyId.name}`)
        }
        if (task.relatedMemberId && typeof task.relatedMemberId === 'object') {
          const member = task.relatedMemberId as any
          relatedInfo.push(`Member: ${member.firstName} ${member.lastName}`)
        }

        const mailOptions = {
          from: `"${emailConfig.fromName}" <${emailConfig.email}>`,
          to: task.email,
          subject: `Task Due Today: ${task.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Task Due Today</h2>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #2563eb;">${task.title}</h3>
                ${task.description ? `<p style="color: #666;">${task.description}</p>` : ''}
                <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
                <p><strong>Priority:</strong> <span style="text-transform: capitalize;">${task.priority}</span></p>
                ${relatedInfo.length > 0 ? `<p><strong>Related:</strong> ${relatedInfo.join(', ')}</p>` : ''}
                ${task.notes ? `<p><strong>Notes:</strong> ${task.notes}</p>` : ''}
              </div>
              <p style="color: #666; font-size: 14px;">This is an automated notification from Kasa Family Management System.</p>
            </div>
          `
        }

        await transporter.sendMail(mailOptions)
        
        // Mark email as sent
        await Task.findByIdAndUpdate(task._id, { emailSent: true })
        results.sent++
      } catch (error: any) {
        console.error(`Error sending email for task ${task._id}:`, error)
        results.failed++
        results.errors.push(`Task ${task.title}: ${error.message}`)
      }
    }

    return NextResponse.json({
      message: `Email notifications sent: ${results.sent} successful, ${results.failed} failed`,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors
    })
  } catch (error: any) {
    console.error('Error sending due date emails:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send due date emails' },
      { status: 500 }
    )
  }
}

