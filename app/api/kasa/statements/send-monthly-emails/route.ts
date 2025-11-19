import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, Statement, Payment, Withdrawal, LifecycleEventPayment, EmailConfig, AutomationSettings } from '@/lib/models'
import { calculateFamilyBalance } from '@/lib/calculations'
import { generateStatementPDF, StatementTransaction } from '@/lib/email-utils'
import nodemailer from 'nodemailer'
import { getAuthenticatedUser } from '@/lib/middleware'

// POST - Automatically send monthly statements via email (called on 1st of each month)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Check if automation is enabled (if user is authenticated)
    try {
      const user = getAuthenticatedUser(request)
      if (user) {
        const mongoose = require('mongoose')
        const userObjectId = new mongoose.Types.ObjectId(user.userId)
        const automationSettings = await AutomationSettings.findOne({ userId: userObjectId })
        
        if (automationSettings && !automationSettings.enableStatementEmails) {
          return NextResponse.json({
            success: false,
            message: 'Statement email automation is disabled for this account',
            sent: 0,
            failed: 0
          })
        }
      }
    } catch (authError) {
      // If no auth, continue (cron jobs may not have auth)
    }
    
    // Get email configuration from database
    const emailConfigDoc = await EmailConfig.findOne({ isActive: true })
    
    if (!emailConfigDoc) {
      return NextResponse.json(
        { error: 'Email configuration not found. Please configure email settings first.' },
        { status: 400 }
      )
    }

    // Calculate previous month's date range
    const now = new Date()
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    
    const from = previousMonth
    const to = lastDayOfPreviousMonth

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfigDoc.email,
        pass: emailConfigDoc.password
      }
    })

    // Find all families with email addresses
    const families = await Family.find({
      $and: [
        { email: { $exists: true } },
        { email: { $ne: null } },
        { email: { $ne: '' } }
      ]
    })

    if (families.length === 0) {
      return NextResponse.json(
        { message: 'No families with email addresses found', sent: 0, failed: 0 },
        { status: 200 }
      )
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each family
    for (const family of families) {
      try {
        // Get opening balance
        const openingBalanceData = await calculateFamilyBalance(
          family._id.toString(),
          new Date(from.getTime() - 1)
        )
        const openingBalance = openingBalanceData.balance

        // Get payments in date range
        const payments = await Payment.find({
          familyId: family._id,
          paymentDate: { $gte: from, $lte: to }
        }).sort({ paymentDate: 1 })
        const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0)

        // Get withdrawals in date range
        const withdrawals = await Withdrawal.find({
          familyId: family._id,
          withdrawalDate: { $gte: from, $lte: to }
        }).sort({ withdrawalDate: 1 })
        const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0)

        // Get lifecycle events in date range (for display only, not included in balance)
        const lifecycleEvents = await LifecycleEventPayment.find({
          familyId: family._id,
          eventDate: { $gte: from, $lte: to }
        }).sort({ eventDate: 1 })
        const totalExpenses = lifecycleEvents.reduce((sum, e) => sum + e.amount, 0)

        // Calculate closing balance (lifecycle events are NOT subtracted from balance)
        const closingBalance = openingBalance + totalIncome - totalWithdrawals

        // Generate statement number
        const statementCount = await Statement.countDocuments({ familyId: family._id })
        const statementNumber = `STMT-${family._id.toString().slice(-6)}-${statementCount + 1}`

        // Create statement record
        const statement = await Statement.create({
          familyId: family._id,
          statementNumber,
          date: new Date(),
          fromDate: from,
          toDate: to,
          openingBalance,
          income: totalIncome,
          withdrawals: totalWithdrawals,
          expenses: totalExpenses,
          closingBalance
        })

        // Combine all transactions
        const transactions: StatementTransaction[] = [
          ...payments.map((p: any) => ({
            type: 'payment' as const,
            date: p.paymentDate,
            description: `Payment - ${p.type || 'membership'}`,
            amount: p.amount,
            notes: p.notes || ''
          })),
          ...withdrawals.map((w: any) => ({
            type: 'withdrawal' as const,
            date: w.withdrawalDate,
            description: `Withdrawal - ${w.reason}`,
            amount: -w.amount,
            notes: ''
          })),
          ...lifecycleEvents.map((e: any) => ({
            type: 'event' as const,
            date: e.eventDate,
            description: `${e.eventType} - ${e.notes || ''}`,
            amount: -e.amount,
            notes: e.notes || ''
          }))
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Generate PDF
        const pdfBuffer = await generateStatementPDF(
          statement.toObject(),
          family.name,
          transactions
        )

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
          from: `"${emailConfigDoc.fromName || 'Kasa Family Management'}" <${emailConfigDoc.email}>`,
          to: family.email,
          subject: `Monthly Statement - ${statement.statementNumber}`,
          text: `Dear ${family.name},

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
              <p>Dear ${family.name},</p>
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
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        })

        results.sent++
      } catch (error: any) {
        results.failed++
        results.errors.push(`${family.name} (${family.email}): ${error.message}`)
        console.error(`Error sending statement to ${family.email}:`, error)
      }
    }

    return NextResponse.json({
      message: `Sent ${results.sent} statements, ${results.failed} failed`,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
      month: previousMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    })
  } catch (error: any) {
    console.error('Error sending monthly statements via email:', error)
    return NextResponse.json(
      { error: 'Failed to send monthly statements via email', details: error.message },
      { status: 500 }
    )
  }
}

