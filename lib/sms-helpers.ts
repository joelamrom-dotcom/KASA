import connectDB from './database'
import { SmsConfig, EmailConfig } from './models'
import nodemailer from 'nodemailer'

/**
 * Format phone number for SMS (remove formatting, keep digits only)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  return phone.replace(/\D/g, '')
}

/**
 * Get carrier email gateway for a phone number
 * Common US carrier gateways
 */
function getCarrierGateway(phoneNumber: string, defaultGateway: string = 'txt.att.net'): string {
  // For now, use default gateway
  // In the future, you could add logic to detect carrier based on phone number prefix
  // or ask users to specify their carrier
  return defaultGateway
}

/**
 * Get SMS configuration for a user
 */
async function getSmsConfig(userId?: string) {
  await connectDB()
  
  // If userId provided, get user-specific config, otherwise get any active config
  const query: any = { isActive: true }
  if (userId) {
    query.userId = userId
  }
  
  const smsConfig = await SmsConfig.findOne(query)
  
  if (!smsConfig) {
    // Return default config if none found
    return {
      defaultGateway: 'txt.att.net',
      emailSubject: 'SMS',
      isActive: true
    }
  }
  
  return smsConfig
}

/**
 * Send SMS via Email-to-SMS gateway
 */
export async function sendSMS(
  phoneNumber: string,
  message: string,
  userId?: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    await connectDB()
    
    // Get SMS config
    const smsConfig = await getSmsConfig(userId)
    
    if (!smsConfig.isActive) {
      return { success: false, error: 'SMS configuration is not active' }
    }
    
    // Get email config for sending
    const emailConfig = await EmailConfig.findOne({ 
      isActive: true,
      ...(userId ? { userId } : {})
    })
    
    if (!emailConfig) {
      throw new Error('Email configuration not found. Email-to-SMS requires email configuration.')
    }
    
    // Format phone number (remove all non-digits)
    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    if (!formattedPhone || formattedPhone.length < 10) {
      return { success: false, error: 'Invalid phone number format' }
    }
    
    // Get carrier gateway
    const carrierGateway = smsConfig.defaultGateway || 'txt.att.net'
    
    // Create email address for SMS
    const emailAddress = `${formattedPhone}@${carrierGateway}`
    
    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfig.email,
        pass: emailConfig.password
      }
    })
    
    // Send email (which will be converted to SMS by carrier)
    const info = await transporter.sendMail({
      from: `${emailConfig.fromName || 'Kasa'} <${emailConfig.email}>`,
      to: emailAddress,
      subject: smsConfig.emailSubject || 'SMS',
      text: message // Plain text only (SMS doesn't support HTML)
    })
    
    console.log(`✅ SMS sent successfully to ${phoneNumber} via ${emailAddress}:`, info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error('Error sending SMS:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send welcome SMS to family
 */
export async function sendFamilyWelcomeSMS(
  phoneNumber: string,
  familyName: string,
  loginUrl: string,
  userId?: string
) {
  // Keep message short for SMS (160 characters recommended)
  const message = `Welcome ${familyName}! Your Kasa account is ready. Login: ${loginUrl}`
  return await sendSMS(phoneNumber, message, userId)
}

/**
 * Send payment confirmation SMS
 */
export async function sendPaymentConfirmationSMS(
  phoneNumber: string,
  familyName: string,
  amount: number,
  paymentDate: Date,
  paymentMethod: string,
  userId?: string
) {
  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amt)
  }
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date)
  }
  
  // Keep message short for SMS
  const shortMethod = paymentMethod.length > 15 
    ? paymentMethod.substring(0, 12) + '...' 
    : paymentMethod
  
  const message = `Payment: ${formatCurrency(amount)} on ${formatDate(paymentDate)} via ${shortMethod}. Thank you!`
  return await sendSMS(phoneNumber, message, userId)
}
