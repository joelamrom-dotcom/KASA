import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { User } from '@/lib/models'
import { generateTOTPSecret, generateQRCode, generateBackupCodes } from '@/lib/2fa-helpers'

export const dynamic = 'force-dynamic'

// POST - Setup 2FA for user
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { method } = body // 'totp', 'sms', 'email'

    const dbUser = await User.findById(user.userId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (method === 'totp') {
      // Generate TOTP secret
      const { secret, otpauthUrl } = generateTOTPSecret(dbUser.email)
      
      // Generate QR code
      const qrCode = await generateQRCode(otpauthUrl)
      
      // Generate backup codes
      const backupCodes = generateBackupCodes(10)
      
      // Store secret temporarily (user needs to verify before enabling)
      dbUser.twoFactorSecret = secret
      dbUser.twoFactorBackupCodes = backupCodes
      await dbUser.save()

      return NextResponse.json({
        secret,
        qrCode,
        backupCodes,
        message: 'Scan QR code with authenticator app and verify to enable 2FA',
      })
    }

    if (method === 'sms' || method === 'email') {
      // SMS and Email 2FA don't need setup, just enable
      dbUser.twoFactorEnabled = true
      await dbUser.save()

      return NextResponse.json({
        message: `${method.toUpperCase()} 2FA enabled. You will receive verification codes via ${method}.`,
      })
    }

    return NextResponse.json({ error: 'Invalid 2FA method' }, { status: 400 })
  } catch (error: any) {
    console.error('Error setting up 2FA:', error)
    return NextResponse.json(
      { error: 'Failed to setup 2FA', details: error.message },
      { status: 500 }
    )
  }
}
