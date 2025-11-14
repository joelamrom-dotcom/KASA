import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User, EmailConfig } from '@/lib/models'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date()
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1) // Token expires in 1 hour

    // Save reset token to user
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = resetTokenExpiry
    await user.save()

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

    // Get email configuration from database
    const emailConfigDoc = await EmailConfig.findOne({ isActive: true })
    
    // Send email if email config exists in database
    if (emailConfigDoc && emailConfigDoc.email && emailConfigDoc.password) {
      try {
        // Create nodemailer transporter using database config
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailConfigDoc.email,
            pass: emailConfigDoc.password
          }
        })

        await transporter.sendMail({
          from: `${emailConfigDoc.fromName || 'Kasa Family Management'} <${emailConfigDoc.email}>`,
          to: user.email,
          subject: 'Password Reset Request - Kasa Family Management',
          html: `
            <h2>Password Reset Request</h2>
            <p>Hello ${user.firstName},</p>
            <p>You requested a password reset for your Kasa Family Management account. Click the link below to reset your password:</p>
            <p><a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
            <p>Or copy and paste this URL into your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            <p>Regards,<br>Kasa Family Management Team</p>
          `,
        })
      } catch (emailError) {
        console.error('Email sending error:', emailError)
        // Still return success to not reveal if user exists
      }
    } else {
      // In development, log the reset URL if no email config
      console.log('Password reset URL (no email config in database):', resetUrl)
      console.log('Please configure email settings in the Settings page to enable password reset emails.')
    }

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    )
  }
}

