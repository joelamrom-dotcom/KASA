import { sendEmail } from './email-helpers'

/**
 * Send refund confirmation email
 */
export async function sendRefundConfirmationEmail(
  familyEmail: string,
  familyName: string,
  refundAmount: number,
  originalAmount: number,
  paymentDate: Date,
  reason: string,
  notes?: string,
  refundedBy?: string
) {
  const subject = 'Refund Confirmation - Kasa Family Management'
  
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

  const reasonText: any = {
    duplicate: 'Duplicate Payment',
    fraudulent: 'Fraudulent Transaction',
    requested_by_customer: 'Requested by Customer',
    cancelled: 'Cancelled Service',
    error: 'Processing Error',
    other: 'Other'
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .refund-box { background: white; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; }
        .amount { font-size: 32px; font-weight: bold; color: #ef4444; text-align: center; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #666; }
        .detail-value { color: #333; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Refund Confirmation</h1>
        </div>
        <div class="content">
          <p>Dear ${familyName},</p>
          
          <p>This email confirms that a refund has been processed for your payment.</p>
          
          <div class="refund-box">
            <div class="amount">${formatCurrency(refundAmount)}</div>
            
            <div class="detail-row">
              <span class="detail-label">Original Payment Amount:</span>
              <span class="detail-value">${formatCurrency(originalAmount)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Refund Amount:</span>
              <span class="detail-value">${formatCurrency(refundAmount)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Date:</span>
              <span class="detail-value">${formatDate(paymentDate)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Refund Reason:</span>
              <span class="detail-value">${reasonText[reason] || reason}</span>
            </div>
            ${notes ? `
            <div class="detail-row">
              <span class="detail-label">Notes:</span>
              <span class="detail-value">${notes}</span>
            </div>
            ` : ''}
            ${refundedBy ? `
            <div class="detail-row">
              <span class="detail-label">Processed By:</span>
              <span class="detail-value">${refundedBy}</span>
            </div>
            ` : ''}
          </div>
          
          <p>${refundAmount === originalAmount 
            ? 'This payment has been fully refunded.' 
            : `This is a partial refund. The remaining amount of ${formatCurrency(originalAmount - refundAmount)} has not been refunded.`}</p>
          
          <p>Please allow 5-10 business days for the refund to appear in your account.</p>
          
          <p>If you have any questions about this refund, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>Kasa Family Management Team</p>
        </div>
        <div class="footer">
          <p>This is an automated confirmation. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail(familyEmail, subject, html, undefined)
}

