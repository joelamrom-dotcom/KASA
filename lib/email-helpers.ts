import nodemailer from 'nodemailer'
import { EmailConfig } from './models'
import connectDB from './database'

/**
 * Get email transporter using active email configuration
 */
async function getEmailTransporter() {
  await connectDB()
  const emailConfigDoc = await EmailConfig.findOne({ isActive: true })
  
  if (!emailConfigDoc) {
    throw new Error('Email configuration not found. Please configure email settings first.')
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailConfigDoc.email,
      pass: emailConfigDoc.password
    }
  })
}

/**
 * Send email using configured email settings
 */
export async function sendEmail(to: string, subject: string, html: string, fromName?: string) {
  try {
    await connectDB()
    const emailConfigDoc = await EmailConfig.findOne({ isActive: true })
    
    if (!emailConfigDoc) {
      console.error('Email configuration not found')
      return { success: false, error: 'Email configuration not found' }
    }

    const transporter = await getEmailTransporter()
    const fromNameToUse = fromName || emailConfigDoc.fromName || 'Kasa Family Management'

    const info = await transporter.sendMail({
      from: `${fromNameToUse} <${emailConfigDoc.email}>`,
      to,
      subject,
      html
    })

    console.log(`✅ Email sent successfully to ${to}:`, info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error('Error sending email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send welcome email to family with login details
 */
export async function sendFamilyWelcomeEmail(
  familyEmail: string,
  familyName: string,
  loginUrl: string,
  phoneNumber?: string
) {
  const subject = 'Welcome to Kasa Family Management'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Kasa Family Management!</h1>
        </div>
        <div class="content">
          <p>Dear ${familyName},</p>
          
          <p>Your family account has been successfully created in the Kasa Family Management system.</p>
          
          <div class="info-box">
            <h3>Login Information</h3>
            <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
            ${phoneNumber ? `<p><strong>Phone Number:</strong> ${phoneNumber}</p>` : ''}
            <p><strong>Login Method:</strong> Use your email address and phone number to log in</p>
          </div>
          
          <p>To access your account:</p>
          <ol>
            <li>Click the login link above or visit the login page</li>
            <li>Select "Family Login"</li>
            <li>Enter your email address: <strong>${familyEmail}</strong></li>
            ${phoneNumber ? `<li>Enter your phone number: <strong>${phoneNumber}</strong></li>` : '<li>Enter any phone number associated with your family account</li>'}
            <li>Click "Log In"</li>
          </ol>
          
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Log In Now</a>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>Kasa Family Management Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail(familyEmail, subject, html)
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  familyEmail: string,
  familyName: string,
  paymentAmount: number,
  paymentDate: Date,
  paymentMethod: string,
  paymentRef?: string,
  notes?: string
) {
  const subject = 'Payment Confirmation - Kasa Family Management'
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .payment-details { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
        .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #666; }
        .detail-value { color: #333; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Payment Received</h1>
        </div>
        <div class="content">
          <p>Dear ${familyName},</p>
          
          <p>This email confirms that we have received your payment.</p>
          
          <div class="payment-details">
            <div class="amount">${formatCurrency(paymentAmount)}</div>
            
            <div class="detail-row">
              <span class="detail-label">Payment Date:</span>
              <span class="detail-value">${formatDate(paymentDate)}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${paymentMethod}</span>
            </div>
            
            ${paymentRef ? `
            <div class="detail-row">
              <span class="detail-label">Reference Number:</span>
              <span class="detail-value">${paymentRef}</span>
            </div>
            ` : ''}
            
            ${notes ? `
            <div class="detail-row">
              <span class="detail-label">Notes:</span>
              <span class="detail-value">${notes}</span>
            </div>
            ` : ''}
          </div>
          
          <p>Thank you for your payment. If you have any questions about this transaction, please contact us.</p>
          
          <p>Best regards,<br>Kasa Family Management Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          ${paymentRef ? `<p>Reference: ${paymentRef}</p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail(familyEmail, subject, html)
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminderEmail(
  familyEmail: string,
  familyName: string,
  paymentAmount: number,
  dueDate: Date,
  daysUntilDue: number,
  userId?: string
) {
  const subject = `Payment Reminder - Payment Due in ${daysUntilDue} ${daysUntilDue === 1 ? 'Day' : 'Days'}`
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .reminder-box { background: white; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        .amount { font-size: 32px; font-weight: bold; color: #f59e0b; text-align: center; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #666; }
        .detail-value { color: #333; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Payment Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${familyName},</p>
          
          <p>This is a friendly reminder that you have a payment due ${daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue} days`}.</p>
          
          <div class="reminder-box">
            <div class="amount">${formatCurrency(paymentAmount)}</div>
            
            <div class="detail-row">
              <span class="detail-label">Due Date:</span>
              <span class="detail-value">${formatDate(dueDate)}</span>
            </div>
          </div>
          
          <p>Please ensure your payment method is up to date. If you have any questions or need assistance, please don't hesitate to contact us.</p>
          
          <p>Thank you for your attention to this matter.</p>
          
          <p>Best regards,<br>Kasa Family Management Team</p>
        </div>
        <div class="footer">
          <p>This is an automated reminder. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail(familyEmail, subject, html, undefined)
}

/**
 * Send thank you email after payment
 */
export async function sendPaymentThankYouEmail(
  familyEmail: string,
  familyName: string,
  paymentAmount: number,
  userId?: string
) {
  const subject = 'Thank You for Your Payment - Kasa Family Management'
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .thank-you-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; text-align: center; }
        .amount { font-size: 28px; font-weight: bold; color: #10b981; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🙏 Thank You!</h1>
        </div>
        <div class="content">
          <p>Dear ${familyName},</p>
          
          <div class="thank-you-box">
            <p style="font-size: 18px; margin-bottom: 10px;">We sincerely appreciate your payment of</p>
            <div class="amount">${formatCurrency(paymentAmount)}</div>
            <p style="font-size: 16px; margin-top: 10px;">Your continued support means the world to us!</p>
          </div>
          
          <p>Thank you for being a valued member of our community. Your timely payment helps us continue to provide excellent service.</p>
          
          <p>If you have any questions or need assistance, please don't hesitate to reach out to us.</p>
          
          <p>With gratitude,<br>Kasa Family Management Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail(familyEmail, subject, html, undefined)
}

