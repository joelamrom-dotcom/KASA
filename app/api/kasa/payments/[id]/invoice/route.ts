import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Payment, Family } from '@/lib/models'
import { getAuthenticatedUser, isAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { createInvoiceDataFromPayment, generateInvoiceHTML } from '@/lib/invoice-helpers'
import { sendEmail } from '@/lib/email-helpers'

export const dynamic = 'force-dynamic'

// GET - Generate invoice HTML/PDF for a payment
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
    const isFamilyMember = user.role === 'family' && user.familyId === family._id?.toString()
    const canViewAll = await hasPermission(user, PERMISSIONS.PAYMENTS_VIEW)
    const isFamilyOwner = family.userId?.toString() === user.userId
    
    if (!canViewAll && !isFamilyMember && !isFamilyOwner) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this payment' },
        { status: 403 }
      )
    }
    
    const isAdminUser = canViewAll || isAdmin(user)
    
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'html' // 'html' or 'pdf'
    const email = searchParams.get('email') === 'true'
    
    // Create invoice data
    const invoiceData = await createInvoiceDataFromPayment(payment, family)
    
    // Get user ID for template
    const templateUserId = family.userId?.toString() || (isAdminUser ? user.userId : undefined)
    const html = await generateInvoiceHTML(invoiceData, templateUserId)
    
    // If email requested
    if (email && family.email && isAdminUser) {
      try {
        await sendEmail(
          family.email,
          `Invoice ${invoiceData.invoiceNumber} - Kasa Family Management`,
          html
        )
        return NextResponse.json({
          success: true,
          message: 'Invoice sent via email',
          invoiceNumber: invoiceData.invoiceNumber
        })
      } catch (emailError: any) {
        console.error('Error sending invoice email:', emailError)
        return NextResponse.json(
          { error: 'Failed to send invoice email', details: emailError.message },
          { status: 500 }
        )
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
    
    // For PDF, we'll return HTML for now (can be enhanced with puppeteer/html-pdf-node)
    // In production, you'd use: const pdf = await generatePDF(html)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${invoiceData.invoiceNumber}.html"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice', details: error.message },
      { status: 500 }
    )
  }
}

