import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/2fa/setup
 * Generate 2FA secret and QR code
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const dbUser = await User.findById(user.userId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Kasa (${dbUser.email})`,
      length: 32,
    })
    
    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    )
    
    // Store secret temporarily (user needs to verify before enabling)
    dbUser.twoFactorSecret = secret.base32
    dbUser.twoFactorBackupCodes = backupCodes
    dbUser.twoFactorVerified = false
    await dbUser.save()
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '')
    
    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes,
      manualEntryKey: secret.base32,
    })
  } catch (error: any) {
    console.error('Error setting up 2FA:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to setup 2FA' },
      { status: 500 }
    )
  }
}

