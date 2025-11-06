import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { EmailConfig } from '@/lib/models'
import nodemailer from 'nodemailer'

// POST - Send a test email
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Get email configuration from database
    const emailConfigDoc = await EmailConfig.findOne({ isActive: true })
    
    if (!emailConfigDoc) {
      return NextResponse.json(
        { error: 'Email configuration not found. Please configure email settings first.' },
        { status: 400 }
      )
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfigDoc.email,
        pass: emailConfigDoc.password
      }
    })

    // Send test email
    await transporter.sendMail({
      from: `"${emailConfigDoc.fromName || 'Kasa Family Management'}" <${emailConfigDoc.email}>`,
      to: emailConfigDoc.email, // Send to self
      subject: 'Test Email - Kasa Family Management',
      text: `This is a test email from Kasa Family Management.

If you received this email, your email configuration is working correctly!

You can now send statements to families via email.

Best regards,
Kasa Family Management System`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4F46E5;">Test Email - Kasa Family Management</h2>
          <p>This is a test email from Kasa Family Management.</p>
          <p>If you received this email, your email configuration is working correctly!</p>
          <p>You can now send statements to families via email.</p>
          <p>Best regards,<br>Kasa Family Management System</p>
        </div>
      `
    })

    return NextResponse.json({
      message: 'Test email sent successfully',
      sent: true
    })
  } catch (error: any) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Failed to send test email', details: error.message },
      { status: 500 }
    )
  }
}

