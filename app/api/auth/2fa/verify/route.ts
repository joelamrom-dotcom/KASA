import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import speakeasy from 'speakeasy'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/2fa/verify
 * Verify 2FA token and enable 2FA
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const data = await request.json()
    const { token } = data
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }
    
    const dbUser = await User.findById(user.userId)
    if (!dbUser || !dbUser.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA not set up. Please setup 2FA first.' },
        { status: 400 }
      )
    }
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret: dbUser.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (60 seconds) of tolerance
    })
    
    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }
    
    // Enable 2FA
    dbUser.twoFactorEnabled = true
    dbUser.twoFactorVerified = true
    await dbUser.save()
    
    return NextResponse.json({ message: '2FA enabled successfully' })
  } catch (error: any) {
    console.error('Error verifying 2FA:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify 2FA' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/2fa/verify
 * Disable 2FA
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const data = await request.json()
    const { password, backupCode } = data
    
    const dbUser = await User.findById(user.userId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Verify password or backup code
    if (password) {
      // TODO: Verify password hash
      // For now, just check if password is provided
    } else if (backupCode) {
      const backupCodes = dbUser.twoFactorBackupCodes || []
      if (!backupCodes.includes(backupCode)) {
        return NextResponse.json(
          { error: 'Invalid backup code' },
          { status: 400 }
        )
      }
      // Remove used backup code
      dbUser.twoFactorBackupCodes = backupCodes.filter((code: string) => code !== backupCode)
    } else {
      return NextResponse.json(
        { error: 'Password or backup code is required' },
        { status: 400 }
      )
    }
    
    // Disable 2FA
    dbUser.twoFactorEnabled = false
    dbUser.twoFactorSecret = undefined
    dbUser.twoFactorVerified = false
    await dbUser.save()
    
    return NextResponse.json({ message: '2FA disabled successfully' })
  } catch (error: any) {
    console.error('Error disabling 2FA:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to disable 2FA' },
      { status: 500 }
    )
  }
}

