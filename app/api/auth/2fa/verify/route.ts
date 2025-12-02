import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { User } from '@/lib/models'
import { verifyTOTP, verifyBackupCode, generateSMSCode, generateEmailCode, storeVerificationCode, verifyCode } from '@/lib/2fa-helpers'
import { sendSMS } from '@/lib/sms-helpers'
import { sendEmail } from '@/lib/email-helpers'

export const dynamic = 'force-dynamic'

// POST - Verify 2FA code and enable/disable
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, method, action } = body // action: 'enable' | 'disable' | 'verify'

    const dbUser = await User.findById(user.userId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (action === 'disable') {
      // Disable 2FA
      dbUser.twoFactorEnabled = false
      dbUser.twoFactorSecret = undefined
      dbUser.twoFactorBackupCodes = []
      dbUser.twoFactorVerified = false
      await dbUser.save()

      return NextResponse.json({ message: '2FA disabled successfully' })
    }

    if (action === 'enable') {
      // Verify code and enable 2FA
      if (method === 'totp') {
        if (!dbUser.twoFactorSecret) {
          return NextResponse.json({ error: '2FA not set up. Please setup first.' }, { status: 400 })
        }

        const isValid = verifyTOTP(code, dbUser.twoFactorSecret)
        if (!isValid) {
          // Check backup codes
          const isBackupCode = verifyBackupCode(code, dbUser.twoFactorBackupCodes || [])
          if (isBackupCode) {
            // Remove used backup code
            dbUser.twoFactorBackupCodes = (dbUser.twoFactorBackupCodes || []).filter(c => c !== code)
            await dbUser.save()
          } else {
            return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
          }
        }

        dbUser.twoFactorEnabled = true
        dbUser.twoFactorVerified = true
        await dbUser.save()

        return NextResponse.json({ message: '2FA enabled successfully' })
      }

      if (method === 'sms') {
        if (!dbUser.phoneNumber) {
          return NextResponse.json({ error: 'Phone number not set' }, { status: 400 })
        }

        // Generate and send SMS code
        const smsCode = generateSMSCode()
        storeVerificationCode(`2fa-sms-${user.userId}`, smsCode)
        
        await sendSMS(
          dbUser.phoneNumber,
          `Your Kasa verification code is: ${smsCode}. Valid for 5 minutes.`,
          user.userId
        )

        return NextResponse.json({ message: 'Verification code sent via SMS' })
      }

      if (method === 'email') {
        // Generate and send email code
        const emailCode = generateEmailCode()
        storeVerificationCode(`2fa-email-${user.userId}`, emailCode)
        
        await sendEmail(
          dbUser.email,
          'Kasa Verification Code',
          `Your verification code is: ${emailCode}. Valid for 5 minutes.`
        )

        return NextResponse.json({ message: 'Verification code sent via email' })
      }
    }

    if (action === 'verify') {
      // Verify code during login
      if (method === 'sms') {
        const result = verifyCode(`2fa-sms-${user.userId}`, code)
        if (!result.valid) {
          return NextResponse.json({ error: result.message || 'Invalid code' }, { status: 400 })
        }
        return NextResponse.json({ message: 'Verification successful' })
      }

      if (method === 'email') {
        const result = verifyCode(`2fa-email-${user.userId}`, code)
        if (!result.valid) {
          return NextResponse.json({ error: result.message || 'Invalid code' }, { status: 400 })
        }
        return NextResponse.json({ message: 'Verification successful' })
      }

      if (method === 'totp') {
        if (!dbUser.twoFactorSecret) {
          return NextResponse.json({ error: '2FA not configured' }, { status: 400 })
        }

        const isValid = verifyTOTP(code, dbUser.twoFactorSecret)
        if (!isValid) {
          // Check backup codes
          const isBackupCode = verifyBackupCode(code, dbUser.twoFactorBackupCodes || [])
          if (isBackupCode) {
            // Remove used backup code
            dbUser.twoFactorBackupCodes = (dbUser.twoFactorBackupCodes || []).filter(c => c !== code)
            await dbUser.save()
            return NextResponse.json({ message: 'Verification successful' })
          }
          return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
        }

        return NextResponse.json({ message: 'Verification successful' })
      }
    }

    return NextResponse.json({ error: 'Invalid action or method' }, { status: 400 })
  } catch (error: any) {
    console.error('Error verifying 2FA:', error)
    return NextResponse.json(
      { error: 'Failed to verify 2FA', details: error.message },
      { status: 500 }
    )
  }
}
