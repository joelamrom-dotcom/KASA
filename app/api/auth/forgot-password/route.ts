import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

// Email configuration (you should move this to environment variables)
const getEmailTransporter = () => {
  // Check if email config exists in database
  // For now, using a simple configuration
  // You should configure this based on your email provider
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

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

    // Send email (only if SMTP is configured)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = getEmailTransporter()
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: user.email,
          subject: 'Password Reset Request',
          html: `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          `,
        })
      } catch (emailError) {
        console.error('Email sending error:', emailError)
        // Still return success to not reveal if user exists
      }
    } else {
      // In development, log the reset URL
      console.log('Password reset URL (development):', resetUrl)
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

