import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { EmailConfig } from '@/lib/models'
import { generateStatementPDF, StatementTransaction } from '@/lib/email-utils'
import nodemailer from 'nodemailer'

// POST - Send a single statement via email
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { statement, familyName, familyEmail, transactions, pdfBuffer } = body

    // Get email configuration from database
    const emailConfigDoc = await EmailConfig.findOne({ isActive: true })
    
    if (!emailConfigDoc) {
      return NextResponse.json(
        { error: 'Email configuration not found. Please configure email settings first.' },
        { status: 400 }
      )
    }

    const emailConfig = {
      email: emailConfigDoc.email,
      password: emailConfigDoc.password,
      fromName: emailConfigDoc.fromName || 'Kasa Family Management'
    }

    if (!familyEmail) {
      return NextResponse.json(
        { error: 'Family email address is required' },
        { status: 400 }
      )
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfig.email,
        pass: emailConfig.password
      }
    })

    // Convert base64 PDF buffer back to Buffer if provided
    let pdfBufferData: Buffer
    if (pdfBuffer) {
      pdfBufferData = Buffer.from(pdfBuffer, 'base64')
    } else {
      // Generate PDF if not provided
      pdfBufferData = await generateStatementPDF(
        statement,
        familyName,
        transactions || []
      )
    }

    // Format dates for email
    const formatDate = (date: Date | string) => {
      const d = new Date(date)
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount)
    }

    // Send email with PDF attachment
    await transporter.sendMail({
      from: `"${emailConfig.fromName || 'Kasa Family Management'}" <${emailConfig.email}>`,
      to: familyEmail,
      subject: `Monthly Statement - ${statement.statementNumber}`,
      text: `Dear ${familyName},

Please find attached your monthly statement for the period ${formatDate(statement.fromDate)} to ${formatDate(statement.toDate)}.

Statement Summary:
- Statement Number: ${statement.statementNumber}
- Opening Balance: ${formatCurrency(statement.openingBalance)}
- Income: ${formatCurrency(statement.income)}
- Withdrawals: ${formatCurrency(statement.withdrawals)}
- Expenses: ${formatCurrency(statement.expenses)}
- Closing Balance: ${formatCurrency(statement.closingBalance)}

The detailed statement is attached as a PDF file.

If you have any questions, please contact us.

Best regards,
Kasa Family Management`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <p>Dear ${familyName},</p>
          <p>Please find attached your monthly statement for the period <strong>${formatDate(statement.fromDate)}</strong> to <strong>${formatDate(statement.toDate)}</strong>.</p>
          
          <h3 style="color: #4F46E5;">Statement Summary:</h3>
          <ul>
            <li><strong>Statement Number:</strong> ${statement.statementNumber}</li>
            <li><strong>Opening Balance:</strong> ${formatCurrency(statement.openingBalance)}</li>
            <li><strong>Income:</strong> <span style="color: #10b981;">${formatCurrency(statement.income)}</span></li>
            <li><strong>Withdrawals:</strong> <span style="color: #ef4444;">${formatCurrency(statement.withdrawals)}</span></li>
            <li><strong>Expenses:</strong> <span style="color: #ef4444;">${formatCurrency(statement.expenses)}</span></li>
            <li><strong>Closing Balance:</strong> <strong>${formatCurrency(statement.closingBalance)}</strong></li>
          </ul>
          
          <p>The detailed statement is attached as a PDF file.</p>
          
          <p>If you have any questions, please contact us.</p>
          
          <p>Best regards,<br>Kasa Family Management</p>
        </div>
      `,
      attachments: [
        {
          filename: `Statement_${statement.statementNumber}.pdf`,
          content: pdfBufferData,
          contentType: 'application/pdf'
        }
      ]
    })

    return NextResponse.json({
      message: 'Statement sent successfully',
      sent: true
    })
  } catch (error: any) {
    console.error('Error sending statement email:', error)
    return NextResponse.json(
      { error: 'Failed to send statement email', details: error.message },
      { status: 500 }
    )
  }
}

