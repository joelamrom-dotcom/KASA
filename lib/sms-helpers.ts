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
 * Get all common US carrier email gateways
 * We'll try all of them to increase delivery success
 */
function getAllCarrierGateways(): string[] {
  return [
    'txt.att.net',           // AT&T
    'vtext.com',             // Verizon
    'tmomail.net',           // T-Mobile
    'messaging.sprintpcs.com', // Sprint
    'email.uscc.net',        // US Cellular
    'mymetropcs.com',        // MetroPCS
    'msg.fi.google.com',     // Google Fi
    'text.republicwireless.com', // Republic Wireless
    'sms.cricketwireless.net',  // Cricket
    'vzwpix.com',            // Verizon (alternative)
    'pm.sprint.com',         // Sprint (alternative)
  ]
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
    
    // Get all carrier gateways to try
    const gateways = getAllCarrierGateways()
    
    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfig.email,
        pass: emailConfig.password
      }
    })
    
    // Try sending to all carrier gateways
    // We'll send to all of them as BCC to increase delivery chances
    const emailAddresses = gateways.map(gateway => `${formattedPhone}@${gateway}`)
    
    // Send email to all gateways (using BCC so recipients don't see each other)
    const info = await transporter.sendMail({
      from: `${emailConfig.fromName || 'Kasa'} <${emailConfig.email}>`,
      to: emailAddresses[0], // Primary recipient
      bcc: emailAddresses.slice(1), // All other gateways as BCC
      subject: smsConfig.emailSubject || 'SMS',
      text: message // Plain text only (SMS doesn't support HTML)
    })
    
    console.log(`✅ SMS sent successfully to ${phoneNumber} via ${emailAddresses.length} carrier gateways:`, info.messageId)
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
