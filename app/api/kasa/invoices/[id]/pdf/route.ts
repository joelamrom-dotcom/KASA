import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Invoice, Family } from '@/lib/models'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export const dynamic = 'force-dynamic'

// GET - Generate PDF for invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const mongoose = require('mongoose')
    const invoiceId = new mongoose.Types.ObjectId(id)
    const userId = new mongoose.Types.ObjectId(user.userId)

    const invoiceResult = await Invoice.findOne({ _id: invoiceId, userId })
      .populate('familyId', 'name email phone address')
      .lean()

    if (!invoiceResult) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Cast to proper type (findOne never returns an array)
    const invoice = invoiceResult as any

    // Create PDF
    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([612, 792]) // US Letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let y = 750

    // Header
    page.drawText('INVOICE', {
      x: 50,
      y,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0)
    })

    y -= 40

    // Invoice details
    page.drawText(`Invoice #: ${invoice.invoiceNumber}`, {
      x: 50,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0)
    })

    y -= 20

    page.drawText(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, {
      x: 50,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0)
    })

    y -= 20

    page.drawText(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, {
      x: 50,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0)
    })

    y -= 40

    // Family info
    const family = invoice.familyId as any
    if (family) {
      page.drawText('Bill To:', {
        x: 50,
        y,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0)
      })

      y -= 20

      page.drawText(family.name || 'N/A', {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0)
      })

      y -= 15

      if (family.email) {
        page.drawText(family.email, {
          x: 50,
          y,
          size: 10,
          font,
          color: rgb(0.5, 0.5, 0.5)
        })
        y -= 15
      }
    }

    y -= 30

    // Items table header
    page.drawText('Description', {
      x: 50,
      y,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    })

    page.drawText('Qty', {
      x: 350,
      y,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    })

    page.drawText('Price', {
      x: 400,
      y,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    })

    page.drawText('Amount', {
      x: 500,
      y,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    })

    y -= 30

    // Items
    for (const item of invoice.items || []) {
      if (y < 100) {
        page = pdfDoc.addPage([612, 792])
        y = 750
      }

      page.drawText(item.description || '', {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0)
      })

      page.drawText(String(item.quantity || 1), {
        x: 350,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0)
      })

      page.drawText(`$${item.unitPrice?.toFixed(2) || '0.00'}`, {
        x: 400,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0)
      })

      page.drawText(`$${item.amount?.toFixed(2) || '0.00'}`, {
        x: 500,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0)
      })

      y -= 20
    }

    y -= 20

    // Total
    page.drawText('Total:', {
      x: 400,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0)
    })

    page.drawText(`$${invoice.total?.toFixed(2) || '0.00'}`, {
      x: 500,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0)
    })

    // Notes
    if (invoice.notes) {
      y -= 40
      page.drawText('Notes:', {
        x: 50,
        y,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0)
      })

      y -= 20
      page.drawText(invoice.notes, {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0)
      })
    }

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
      }
    })
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    )
  }
}
