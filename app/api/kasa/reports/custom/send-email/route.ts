import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { CustomReport, EmailConfig } from '@/lib/models'
import nodemailer from 'nodemailer'

// POST - Send report via email
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { reportId, recipients, subject, message, format, reportData } = body

    if (!reportId || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Report ID and recipients are required' },
        { status: 400 }
      )
    }

    // Get email configuration
    const emailConfigDoc = await EmailConfig.findOne({ isActive: true })
    
    if (!emailConfigDoc) {
      return NextResponse.json(
        { error: 'Email configuration not found. Please configure email settings first.' },
        { status: 400 }
      )
    }

    // Get report
    const report = await CustomReport.findById(reportId)
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Generate export file
    const exportRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/kasa/reports/custom/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify({
        reportId,
        format,
        reportData
      })
    })

    if (!exportRes.ok) {
      return NextResponse.json(
        { error: 'Failed to generate export file' },
        { status: 500 }
      )
    }

    const fileBuffer = await exportRes.arrayBuffer()
    const fileExtension = format === 'excel' ? 'xlsx' : format
    const fileName = `${report.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.${fileExtension}`

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfigDoc.email,
        pass: emailConfigDoc.password
      }
    })

    // Send email to each recipient
    const results = []
    for (const recipient of recipients) {
      try {
        await transporter.sendMail({
          from: `"${emailConfigDoc.fromName || 'Kasa Family Management'}" <${emailConfigDoc.email}>`,
          to: recipient,
          subject: subject || `Report: ${report.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>${report.name}</h2>
              ${report.description ? `<p>${report.description}</p>` : ''}
              <p>${message || 'Please find the attached report.'}</p>
              <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
          `,
          attachments: [
            {
              filename: fileName,
              content: Buffer.from(fileBuffer),
              contentType: format === 'pdf' ? 'application/pdf' : format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv'
            }
          ]
        })
        results.push({ recipient, success: true })
      } catch (error: any) {
        console.error(`Error sending email to ${recipient}:`, error)
        results.push({ recipient, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Report sent to ${successCount} recipient(s)${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results
    })
  } catch (error: any) {
    console.error('Error sending report email:', error)
    return NextResponse.json(
      { error: 'Failed to send report email', details: error.message },
      { status: 500 }
    )
  }
}

