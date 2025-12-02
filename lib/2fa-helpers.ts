import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

/**
 * Two-Factor Authentication Helpers
 * Complete 2FA implementation with TOTP, SMS, and Email
 */

/**
 * Generate TOTP secret for user
 */
export function generateTOTPSecret(userEmail: string, serviceName: string = 'Kasa') {
  const secret = speakeasy.generateSecret({
    name: `${serviceName} (${userEmail})`,
    issuer: serviceName,
    length: 32,
  })

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
  }
}

/**
 * Generate QR code for TOTP setup
 */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl)
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Verify TOTP token
 */
export function verifyTOTP(token: string, secret: string, window: number = 2): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window, // Allow tokens within ±2 time steps
  })
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // Generate 8-digit backup code
    const code = Math.floor(10000000 + Math.random() * 90000000).toString()
    codes.push(code)
  }
  return codes
}

/**
 * Verify backup code
 */
export function verifyBackupCode(code: string, backupCodes: string[]): boolean {
  return backupCodes.includes(code)
}

/**
 * Generate SMS verification code
 */
export function generateSMSCode(length: number = 6): string {
  return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString()
}

/**
 * Generate email verification code
 */
export function generateEmailCode(length: number = 6): string {
  return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString()
}

/**
 * Store verification code with expiration
 */
export interface VerificationCode {
  code: string
  expiresAt: number
  attempts: number
  maxAttempts: number
}

const verificationCodes = new Map<string, VerificationCode>()

export function storeVerificationCode(
  key: string,
  code: string,
  ttl: number = 300000 // 5 minutes
): void {
  verificationCodes.set(key, {
    code,
    expiresAt: Date.now() + ttl,
    attempts: 0,
    maxAttempts: 3,
  })

  // Clean up expired codes
  setTimeout(() => {
    verificationCodes.delete(key)
  }, ttl)
}

export function verifyCode(key: string, code: string): { valid: boolean; message?: string } {
  const stored = verificationCodes.get(key)
  if (!stored) {
    return { valid: false, message: 'Code not found or expired' }
  }

  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(key)
    return { valid: false, message: 'Code expired' }
  }

  if (stored.attempts >= stored.maxAttempts) {
    verificationCodes.delete(key)
    return { valid: false, message: 'Maximum attempts exceeded' }
  }

  stored.attempts++

  if (stored.code !== code) {
    return { valid: false, message: 'Invalid code' }
  }

  verificationCodes.delete(key)
  return { valid: true }
}

