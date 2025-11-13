import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { EmailConfig } from '@/lib/models'
import nodemailer from 'nodemailer'

// POST - Send a file via email as attachment
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const to = formData.get('to') as string
    const subject = formData.get('subject') as string || 'File from Kasa Family Management'
    const message = formData.get('message') as string || 'Please find the attached file.'
    const fromEmail = formData.get('fromEmail') as string // Optional: override default email
    
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    if (!to) {
      return NextResponse.json(
        { error: 'Recipient email address is required' },
        { status: 400 }
      )
    }

    // Get email configuration from database
    const emailConfigDoc = await EmailConfig.findOne({ isActive: true })
    
    if (!emailConfigDoc) {
      return NextResponse.json(
        { error: 'Email configuration not found. Please configure email settings first.' },
        { status: 400 }
      )
    }

    const emailConfig = {
      email: fromEmail || emailConfigDoc.email,
      password: emailConfigDoc.password,
      fromName: emailConfigDoc.fromName || 'Kasa Family Management'
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfig.email,
        pass: emailConfig.password
      }
    })

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Send email with attachment
    await transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.email}>`,
      to: to,
      subject: subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <p>${message.replace(/\n/g, '<br>')}</p>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            Best regards,<br>
            ${emailConfig.fromName}
          </p>
        </div>
      `,
      attachments: [
        {
          filename: file.name,
          content: buffer,
          contentType: file.type || undefined
        }
      ]
    })

    return NextResponse.json({
      message: 'File sent successfully',
      sent: true,
      recipient: to
    })
  } catch (error: any) {
    console.error('Error sending file email:', error)
    return NextResponse.json(
      { error: 'Failed to send file', details: error.message },
      { status: 500 }
    )
  }
}

