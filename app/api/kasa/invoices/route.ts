import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, Payment, InvoiceTemplate } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get invoices
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const familyId = searchParams.get('familyId')
    const status = searchParams.get('status') // 'draft', 'sent', 'paid', 'overdue'

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Invoices would be stored in Invoice schema (would need to add)
    // For now, return structure
    return NextResponse.json({
      invoices: [],
      message: 'Invoice system ready (schema needed)'
    })
  } catch (error: any) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create invoice
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { familyId, items, dueDate, templateId, notes } = body

    if (!familyId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const family = await Family.findById(familyId).lean()
    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)

    // Create invoice (would need Invoice schema)
    const invoice = {
      invoiceNumber: `INV-${Date.now()}`,
      familyId,
      items,
      subtotal: totalAmount,
      total: totalAmount,
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      status: 'draft',
      createdAt: new Date()
    }

    return NextResponse.json({
      success: true,
      invoice,
      message: 'Invoice created (schema needed for persistence)'
    })
  } catch (error: any) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice', details: error.message },
      { status: 500 }
    )
  }
}

