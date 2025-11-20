import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Payment, Family, AutomationSettings } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { createReceiptDataFromPayment, generateReceiptHTML } from '@/lib/invoice-helpers'
import { sendEmail } from '@/lib/email-helpers'

export const dynamic = 'force-dynamic'

// GET - Generate receipt HTML/PDF for a payment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const payment = await Payment.findById(params.id).populate('familyId')
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }
    
    // Check access
    const family = payment.familyId as any
    const isFamilyMember = user.role === 'family' && user.familyId === params.id
    const isAdminUser = isAdmin(user)
    const isFamilyOwner = family.userId?.toString() === user.userId
    
    if (!isAdminUser && !isFamilyMember && !isFamilyOwner) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this payment' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'html' // 'html' or 'pdf'
    const email = searchParams.get('email') === 'true'
    const autoSend = searchParams.get('autoSend') === 'true' // Auto-send after payment
    
    // Create receipt data
    const receiptData = await createReceiptDataFromPayment(payment, family)
    
    // Get user ID for template
    const templateUserId = family.userId?.toString() || (isAdminUser ? user.userId : undefined)
    const html = await generateReceiptHTML(receiptData, templateUserId)
    
    // If email requested (or auto-send)
    if ((email || autoSend) && family.email) {
      // Check if auto-send is enabled and family wants emails
      let shouldSendEmail = false
      
      if (autoSend) {
        // Check automation settings
        const mongoose = require('mongoose')
        const adminObjectId = new mongoose.Types.ObjectId(family.userId || user.userId)
        const automationSettings = await AutomationSettings.findOne({ userId: adminObjectId })
        const shouldAutoSend = automationSettings?.enablePaymentEmails !== false
        const familyWantsEmails = family.receiveEmails !== false
        shouldSendEmail = shouldAutoSend && familyWantsEmails && isAdminUser
      } else {
        shouldSendEmail = isAdminUser
      }
      
      if (shouldSendEmail) {
        try {
          await sendEmail(
            family.email,
            `Receipt ${receiptData.receiptNumber} - Kasa Family Management`,
            html
          )
          return NextResponse.json({
            success: true,
            message: 'Receipt sent via email',
            receiptNumber: receiptData.receiptNumber
          })
        } catch (emailError: any) {
          console.error('Error sending receipt email:', emailError)
          // Don't fail if email fails, just return the receipt HTML
        }
      }
    }
    
    // Return HTML
    if (format === 'html') {
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    }
    
    // For PDF format, return HTML optimized for PDF printing
    // Browser will handle PDF generation via print dialog
    // For server-side PDF generation, you can use puppeteer or similar
    const pdfHTML = html.replace(
      '</head>',
      `
      <style>
        @media print {
          @page { margin: 1cm; size: letter; }
          body { margin: 0; padding: 0; }
        }
      </style>
      </head>
      `
    )
    
    return new NextResponse(pdfHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="receipt-${receiptData.receiptNumber}.html"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating receipt:', error)
    return NextResponse.json(
      { error: 'Failed to generate receipt', details: error.message },
      { status: 500 }
    )
  }
}

