import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Payment } from '@/lib/models'

// GET - Get all payments for a family
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const payments = await Payment.find({ familyId: params.id }).sort({ paymentDate: -1 })
    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Add a new payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const body = await request.json()
    const { amount, paymentDate, year, type, notes } = body

    if (!amount || !paymentDate || !year) {
      return NextResponse.json(
        { error: 'Amount, payment date, and year are required' },
        { status: 400 }
      )
    }

    const payment = await Payment.create({
      familyId: params.id,
      amount: parseFloat(amount),
      paymentDate: new Date(paymentDate),
      year: parseInt(year),
      type: type || 'membership',
      notes: notes || undefined
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment', details: error.message },
      { status: 500 }
    )
  }
}

