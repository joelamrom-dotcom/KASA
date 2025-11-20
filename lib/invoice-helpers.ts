import { Payment, Family, FamilyMember, InvoiceTemplate } from './models'
import connectDB from './database'

export interface InvoiceData {
  invoiceNumber: string
  invoiceDate: Date
  dueDate?: Date
  family: {
    name: string
    hebrewName?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    email?: string
    phone?: string
  }
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }>
  subtotal: number
  tax?: number
  total: number
  paymentMethod?: string
  notes?: string
  paymentId?: string
}

export interface ReceiptData {
  receiptNumber: string
  receiptDate: Date
  family: {
    name: string
    hebrewName?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    email?: string
    phone?: string
  }
  payment: {
    amount: number
    paymentDate: Date
    paymentMethod: string
    transactionId?: string
    cardLast4?: string
    cardType?: string
  }
  notes?: string
  paymentId?: string
}

/**
 * Get invoice template for user
 */
export async function getInvoiceTemplate(userId: string, templateType: 'invoice' | 'receipt'): Promise<any> {
  await connectDB()
  const mongoose = require('mongoose')
  const userObjectId = new mongoose.Types.ObjectId(userId)
  
  // Try to find user-specific template
  let template = await InvoiceTemplate.findOne({
    userId: userObjectId,
    templateType,
    isActive: true
  }).lean()
  
  // If no user-specific template, try to find default template
  if (!template) {
    template = await InvoiceTemplate.findOne({
      templateType,
      isDefault: true,
      isActive: true
    }).lean()
  }
  
  // Return default values if no template found
  return template || {
    headerText: 'KASA',
    headerSubtext: 'Family Management',
    headerColor: '#333333',
    primaryColor: '#333333',
    secondaryColor: '#666666',
    fontFamily: 'Arial, sans-serif',
    footerText: 'Thank you for your business!',
    footerSubtext: 'Kasa Family Management',
    customCSS: ''
  }
}

/**
 * Generate invoice HTML
 */
export async function generateInvoiceHTML(data: InvoiceData, userId?: string, template?: any): Promise<string> {
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

  // Get template if not provided
  let templateData = template
  if (!templateData && userId) {
    templateData = await getInvoiceTemplate(userId, 'invoice')
  } else if (!templateData) {
    templateData = {
      headerText: 'KASA',
      headerSubtext: 'Family Management',
      headerColor: '#333333',
      primaryColor: '#333333',
      secondaryColor: '#666666',
      fontFamily: 'Arial, sans-serif',
      footerText: 'Thank you for your business!',
      footerSubtext: 'Kasa Family Management',
      customCSS: ''
    }
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${templateData.fontFamily}; font-size: 12px; color: ${templateData.primaryColor}; background: #fff; padding: 20px; }
    .invoice-container { max-width: 800px; margin: 0 auto; background: #fff; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid ${templateData.headerColor}; }
    .logo { font-size: 24px; font-weight: bold; color: ${templateData.headerColor}; }
    .invoice-info { text-align: right; }
    .invoice-info h1 { font-size: 32px; margin-bottom: 10px; color: #333; }
    .invoice-info p { margin: 5px 0; color: #666; }
    .billing-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .billing-section { flex: 1; }
    .billing-section h3 { font-size: 14px; margin-bottom: 10px; color: #333; text-transform: uppercase; }
    .billing-section p { margin: 3px 0; color: #666; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
    .items-table td { padding: 12px; border-bottom: 1px solid #eee; }
    .items-table tr:hover { background: #f9f9f9; }
    .text-right { text-align: right; }
    .totals { margin-left: auto; width: 300px; margin-top: 20px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .totals-row.total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; border-bottom: 2px solid #333; padding-top: 10px; margin-top: 10px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 10px; }
    .notes { margin-top: 30px; padding: 15px; background: #f9f9f9; border-left: 4px solid #333; }
    .notes h4 { margin-bottom: 10px; color: #333; }
  </style>
</head>
<body>
      <div class="invoice-container">
        <div class="header">
          ${templateData.headerLogo ? `<img src="${templateData.headerLogo}" alt="Logo" style="max-height: 60px;" />` : ''}
          <div class="logo">${templateData.headerText || 'KASA'}</div>
      <div class="invoice-info">
        <h1>INVOICE</h1>
        <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
        <p><strong>Date:</strong> ${formatDate(data.invoiceDate)}</p>
        ${data.dueDate ? `<p><strong>Due Date:</strong> ${formatDate(data.dueDate)}</p>` : ''}
      </div>
    </div>

    <div class="billing-info">
      <div class="billing-section">
        <h3>Bill To:</h3>
        <p><strong>${data.family.name}</strong></p>
        ${data.family.hebrewName ? `<p>${data.family.hebrewName}</p>` : ''}
        ${data.family.address ? `<p>${data.family.address}</p>` : ''}
        ${data.family.city || data.family.state || data.family.zip 
          ? `<p>${[data.family.city, data.family.state, data.family.zip].filter(Boolean).join(', ')}</p>` 
          : ''}
        ${data.family.email ? `<p>${data.family.email}</p>` : ''}
        ${data.family.phone ? `<p>${data.family.phone}</p>` : ''}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map(item => `
          <tr>
            <td>${item.description}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.unitPrice)}</td>
            <td class="text-right">${formatCurrency(item.amount)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Subtotal:</span>
        <span>${formatCurrency(data.subtotal)}</span>
      </div>
      ${data.tax ? `
      <div class="totals-row">
        <span>Tax:</span>
        <span>${formatCurrency(data.tax)}</span>
      </div>
      ` : ''}
      <div class="totals-row total">
        <span>Total:</span>
        <span>${formatCurrency(data.total)}</span>
      </div>
    </div>

    ${data.paymentMethod ? `
    <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-left: 4px solid #3b82f6;">
      <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
    </div>
    ` : ''}

    ${data.notes ? `
    <div class="notes">
      <h4>Notes:</h4>
      <p>${data.notes}</p>
    </div>
    ` : ''}

        <div class="footer">
          <p>${templateData.footerText || 'Thank you for your business!'}</p>
          <p>${templateData.footerSubtext || 'Kasa Family Management'}</p>
        </div>
      </div>
      ${templateData.customCSS ? `<style>${templateData.customCSS}</style>` : ''}
    </body>
    </html>
  `
}

/**
 * Generate receipt HTML
 */
export async function generateReceiptHTML(data: ReceiptData, userId?: string, template?: any): Promise<string> {
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Get template if not provided
  let templateData = template
  if (!templateData && userId) {
    templateData = await getInvoiceTemplate(userId, 'receipt')
  } else if (!templateData) {
    templateData = {
      headerText: 'KASA',
      headerSubtext: 'Family Management',
      headerColor: '#333333',
      primaryColor: '#333333',
      secondaryColor: '#666666',
      fontFamily: 'Arial, sans-serif',
      footerText: 'Thank you for your payment!',
      footerSubtext: 'Kasa Family Management',
      customCSS: ''
    }
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: ${templateData.fontFamily}; font-size: 12px; color: ${templateData.primaryColor}; background: #fff; padding: 20px; }
      .receipt-container { max-width: 600px; margin: 0 auto; background: #fff; }
      .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid ${templateData.headerColor}; }
      .header h1 { font-size: 36px; margin-bottom: 10px; color: ${templateData.headerColor}; }
    .header p { color: #666; }
    .receipt-info { text-align: center; margin-bottom: 20px; }
    .receipt-info p { margin: 5px 0; color: #666; }
    .customer-info { margin-bottom: 30px; padding: 15px; background: #f9f9f9; }
    .customer-info h3 { font-size: 14px; margin-bottom: 10px; color: #333; text-transform: uppercase; }
    .customer-info p { margin: 3px 0; color: #666; }
    .payment-details { margin-bottom: 30px; padding: 20px; background: #f0f9ff; border-left: 4px solid #10b981; }
    .payment-details h3 { font-size: 16px; margin-bottom: 15px; color: #333; }
    .payment-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .payment-row:last-child { border-bottom: none; }
    .payment-row .label { font-weight: bold; color: #666; }
    .payment-row .value { color: #333; font-size: 14px; }
    .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; padding: 20px; background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 10px; }
    .notes { margin-top: 30px; padding: 15px; background: #f9f9f9; border-left: 4px solid #333; }
    .notes h4 { margin-bottom: 10px; color: #333; }
  </style>
</head>
<body>
      <div class="receipt-container">
        <div class="header">
          ${templateData.headerLogo ? `<img src="${templateData.headerLogo}" alt="Logo" style="max-height: 60px; margin-bottom: 10px;" />` : ''}
          <h1>RECEIPT</h1>
          <p>${templateData.headerSubtext || 'Kasa Family Management'}</p>
        </div>

    <div class="receipt-info">
      <p><strong>Receipt #:</strong> ${data.receiptNumber}</p>
      <p><strong>Date:</strong> ${formatDate(data.receiptDate)}</p>
    </div>

    <div class="customer-info">
      <h3>Customer Information</h3>
      <p><strong>${data.family.name}</strong></p>
      ${data.family.hebrewName ? `<p>${data.family.hebrewName}</p>` : ''}
      ${data.family.address ? `<p>${data.family.address}</p>` : ''}
      ${data.family.city || data.family.state || data.family.zip 
        ? `<p>${[data.family.city, data.family.state, data.family.zip].filter(Boolean).join(', ')}</p>` 
        : ''}
      ${data.family.email ? `<p>${data.family.email}</p>` : ''}
      ${data.family.phone ? `<p>${data.family.phone}</p>` : ''}
    </div>

    <div class="amount">${formatCurrency(data.payment.amount)}</div>

    <div class="payment-details">
      <h3>Payment Details</h3>
      <div class="payment-row">
        <span class="label">Payment Date:</span>
        <span class="value">${formatDate(data.payment.paymentDate)}</span>
      </div>
      <div class="payment-row">
        <span class="label">Payment Method:</span>
        <span class="value">${data.payment.paymentMethod}</span>
      </div>
      ${data.payment.cardLast4 ? `
      <div class="payment-row">
        <span class="label">Card:</span>
        <span class="value">${data.payment.cardType || 'Card'} •••• ${data.payment.cardLast4}</span>
      </div>
      ` : ''}
      ${data.payment.transactionId ? `
      <div class="payment-row">
        <span class="label">Transaction ID:</span>
        <span class="value">${data.payment.transactionId}</span>
      </div>
      ` : ''}
    </div>

    ${data.notes ? `
    <div class="notes">
      <h4>Notes:</h4>
      <p>${data.notes}</p>
    </div>
    ` : ''}

        <div class="footer">
          <p>${templateData.footerText || 'Thank you for your payment!'}</p>
          <p>${templateData.footerSubtext || 'Kasa Family Management'}</p>
          <p style="margin-top: 10px;">This is a computer-generated receipt. No signature required.</p>
        </div>
      </div>
      ${templateData.customCSS ? `<style>${templateData.customCSS}</style>` : ''}
    </body>
    </html>
  `
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(paymentId: string, date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const shortId = paymentId.slice(-6).toUpperCase()
  return `INV-${year}${month}${day}-${shortId}`
}

/**
 * Generate receipt number
 */
export function generateReceiptNumber(paymentId: string, date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const shortId = paymentId.slice(-6).toUpperCase()
  return `RCP-${year}${month}${day}-${shortId}`
}

/**
 * Create invoice data from payment
 */
export async function createInvoiceDataFromPayment(payment: any, family: any): Promise<InvoiceData> {
  const invoiceNumber = generateInvoiceNumber(payment._id.toString(), new Date(payment.paymentDate))
  
  // Format payment method
  let paymentMethodDisplay = payment.paymentMethod || 'Unknown'
  if (paymentMethodDisplay === 'credit_card' && payment.ccInfo) {
    paymentMethodDisplay = `${payment.ccInfo.cardType || 'Credit Card'} ending in ${payment.ccInfo.last4 || '****'}`
  } else if (paymentMethodDisplay === 'credit_card') {
    paymentMethodDisplay = 'Credit Card'
  } else if (paymentMethodDisplay === 'check' && payment.checkInfo) {
    paymentMethodDisplay = `Check (****${payment.checkInfo.accountNumber?.slice(-4) || '****'})`
  }

  return {
    invoiceNumber,
    invoiceDate: new Date(payment.paymentDate),
    family: {
      name: family.name || '',
      hebrewName: family.hebrewName,
      address: family.address || family.street,
      city: family.city,
      state: family.state,
      zip: family.zip,
      email: family.email,
      phone: family.phone || family.husbandCellPhone || family.wifeCellPhone
    },
    items: [{
      description: payment.type === 'membership' ? 'Membership Payment' : payment.type === 'donation' ? 'Donation' : 'Payment',
      quantity: 1,
      unitPrice: payment.amount,
      amount: payment.amount
    }],
    subtotal: payment.amount,
    total: payment.amount,
    paymentMethod: paymentMethodDisplay,
    notes: payment.notes,
    paymentId: payment._id.toString()
  }
}

/**
 * Create receipt data from payment
 */
export async function createReceiptDataFromPayment(payment: any, family: any): Promise<ReceiptData> {
  const receiptNumber = generateReceiptNumber(payment._id.toString(), new Date(payment.paymentDate))
  
  // Format payment method
  let paymentMethodDisplay = payment.paymentMethod || 'Unknown'
  if (paymentMethodDisplay === 'credit_card' && payment.ccInfo) {
    paymentMethodDisplay = `${payment.ccInfo.cardType || 'Credit Card'} ending in ${payment.ccInfo.last4 || '****'}`
  } else if (paymentMethodDisplay === 'credit_card') {
    paymentMethodDisplay = 'Credit Card'
  } else if (paymentMethodDisplay === 'check' && payment.checkInfo) {
    paymentMethodDisplay = `Check (****${payment.checkInfo.accountNumber?.slice(-4) || '****'})`
  }

  return {
    receiptNumber,
    receiptDate: new Date(payment.paymentDate),
    family: {
      name: family.name || '',
      hebrewName: family.hebrewName,
      address: family.address || family.street,
      city: family.city,
      state: family.state,
      zip: family.zip,
      email: family.email,
      phone: family.phone || family.husbandCellPhone || family.wifeCellPhone
    },
    payment: {
      amount: payment.amount,
      paymentDate: new Date(payment.paymentDate),
      paymentMethod: paymentMethodDisplay,
      transactionId: payment.stripePaymentIntentId,
      cardLast4: payment.ccInfo?.last4,
      cardType: payment.ccInfo?.cardType
    },
    notes: payment.notes,
    paymentId: payment._id.toString()
  }
}

