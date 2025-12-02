import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import { sendEmail } from '@/lib/email-helpers'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// POST - Send magic link for passwordless login
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      // Don't reveal if user exists (security best practice)
      return NextResponse.json({ 
        message: 'If an account exists with this email, a magic link has been sent.' 
      })
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store token in user record
    user.resetPasswordToken = token
    user.resetPasswordExpires = expiresAt
    await user.save()

    // Generate magic link
    const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const magicLink = `${baseUrl}/auth/magic-link?token=${token}&email=${encodeURIComponent(email)}`

    // Send magic link email
    await sendEmail(
      email,
      'Your Kasa Magic Link',
      `
        <h2>Sign in to Kasa</h2>
        <p>Click the link below to sign in to your account:</p>
        <p><a href="${magicLink}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Sign In</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${magicLink}</p>
        <p><strong>This link expires in 15 minutes.</strong></p>
        <p>If you didn't request this link, you can safely ignore this email.</p>
      `
    )

    return NextResponse.json({ 
      message: 'Magic link sent to your email. Check your inbox.' 
    })
  } catch (error: any) {
    console.error('Error sending magic link:', error)
    return NextResponse.json(
      { error: 'Failed to send magic link', details: error.message },
      { status: 500 }
    )
  }
}

