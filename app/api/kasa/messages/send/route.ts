import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, MessageHistory } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { auditLogFromRequest } from '@/lib/audit-log'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

// POST - Send bulk messages
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!(await hasPermission(user, PERMISSIONS.COMMUNICATION_SEND))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { familyIds, type, subject, body: messageBody } = body

    if (!familyIds || !Array.isArray(familyIds) || familyIds.length === 0) {
      return NextResponse.json({ error: 'At least one family required' }, { status: 400 })
    }

    if (!messageBody) {
      return NextResponse.json({ error: 'Message body required' }, { status: 400 })
    }

    if (type === 'email' && !subject) {
      return NextResponse.json({ error: 'Subject required for email' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Fetch families
    const families = await Family.find({
      _id: { $in: familyIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
      userId
    })

    let successCount = 0
    let failureCount = 0
    const recipients: string[] = []

    if (type === 'email') {
      // Send emails
      const emailConfig = await require('@/lib/models').EmailConfig.findOne({ userId })
      
      if (!emailConfig) {
        return NextResponse.json({ error: 'Email not configured' }, { status: 400 })
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailConfig.email,
          pass: emailConfig.password
        }
      })

      for (const family of families) {
        if (!family.email || family.receiveEmails === false) {
          failureCount++
          continue
        }

        try {
          await transporter.sendMail({
            from: `"${emailConfig.fromName || 'Kasa Family Management'}" <${emailConfig.email}>`,
            to: family.email,
            subject,
            text: messageBody,
            html: messageBody.replace(/\n/g, '<br>')
          })
          successCount++
          recipients.push(family.email)
        } catch (error) {
          console.error(`Error sending email to ${family.email}:`, error)
          failureCount++
        }
      }
    } else {
      // Send SMS (using email-to-SMS gateway)
      const smsConfig = await require('@/lib/models').SmsConfig.findOne({ userId })
      
      if (!smsConfig) {
        return NextResponse.json({ error: 'SMS not configured' }, { status: 400 })
      }

      const emailConfig = await require('@/lib/models').EmailConfig.findOne({ userId })
      
      if (!emailConfig) {
        return NextResponse.json({ error: 'Email not configured (required for SMS)' }, { status: 400 })
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailConfig.email,
          pass: emailConfig.password
        }
      })

      for (const family of families) {
        const phoneNumber = family.husbandCellPhone || family.wifeCellPhone
        if (!phoneNumber || family.receiveSMS === false) {
          failureCount++
          continue
        }

        try {
          // Use email-to-SMS gateway
          const smsEmail = `${phoneNumber.replace(/\D/g, '')}@${smsConfig.gateway || 'txt.att.net'}`
          
          await transporter.sendMail({
            from: emailConfig.email,
            to: smsEmail,
            subject: '',
            text: messageBody.substring(0, 160) // SMS limit
          })
          successCount++
          recipients.push(phoneNumber)
        } catch (error) {
          console.error(`Error sending SMS to ${phoneNumber}:`, error)
          failureCount++
        }
      }
    }

    // Save to history
    const messageHistory = await MessageHistory.create({
      userId,
      type,
      subject: type === 'email' ? subject : undefined,
      body: messageBody,
      recipients,
      successCount,
      failureCount,
      status: failureCount === 0 ? 'sent' : (successCount > 0 ? 'partial' : 'failed')
    })

    // Create audit log entry
    await auditLogFromRequest(request, user, 'message_send', 'message', {
      entityId: messageHistory._id.toString(),
      entityName: `Bulk ${type} message`,
      description: `Sent ${type} message to ${successCount} recipients (${failureCount} failed)`,
      metadata: {
        type,
        subject: type === 'email' ? subject : undefined,
        successCount,
        failureCount,
        totalRecipients: families.length,
        recipients: recipients.slice(0, 10), // First 10 recipients
      }
    })

    return NextResponse.json({
      success: true,
      successCount,
      failureCount,
      total: families.length
    })
  } catch (error: any) {
    console.error('Error sending messages:', error)
    return NextResponse.json(
      { error: 'Failed to send messages', details: error.message },
      { status: 500 }
    )
  }
}

