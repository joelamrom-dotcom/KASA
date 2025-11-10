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
    
    // Log payment methods to debug
    console.log(`Fetched ${payments.length} payments for family ${params.id}`)
    payments.forEach((payment: any, index: number) => {
      const paymentObj = payment.toObject ? payment.toObject() : payment
      console.log(`Payment ${index + 1}:`, {
        _id: paymentObj._id,
        amount: paymentObj.amount,
        paymentMethod: paymentObj.paymentMethod,
        hasCcInfo: !!paymentObj.ccInfo,
        hasCheckInfo: !!paymentObj.checkInfo
      })
    })
    
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
    const { amount, paymentDate, year, type, paymentMethod, ccInfo, checkInfo, notes } = body

    console.log('Received payment data:', { amount, paymentDate, year, type, paymentMethod, ccInfo, checkInfo })

    if (amount === undefined || amount === null || !paymentDate || !year) {
      return NextResponse.json(
        { error: 'Amount, payment date, and year are required' },
        { status: 400 }
      )
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Ensure paymentMethod is set correctly (default to cash only if truly missing)
    const finalPaymentMethod = paymentMethod && paymentMethod !== '' ? paymentMethod : 'cash'
    
    console.log('Payment method processing:', {
      received: paymentMethod,
      type: typeof paymentMethod,
      final: finalPaymentMethod
    })

    const paymentData: any = {
      familyId: params.id,
      amount: parseFloat(amount),
      paymentDate: new Date(paymentDate),
      year: parseInt(year),
      type: type || 'membership',
      paymentMethod: finalPaymentMethod,
      notes: notes || undefined
    }
    
    console.log('Payment data before adding ccInfo/checkInfo:', JSON.stringify(paymentData, null, 2))

    // Add credit card info if provided
    if (finalPaymentMethod === 'credit_card' && ccInfo) {
      console.log('Adding ccInfo for credit_card payment')
      paymentData.ccInfo = ccInfo
    } else if (finalPaymentMethod === 'credit_card') {
      console.log('WARNING: credit_card selected but no ccInfo provided')
    }

    // Add check info if provided
    if (finalPaymentMethod === 'check' && checkInfo) {
      console.log('Adding checkInfo for check payment')
      paymentData.checkInfo = checkInfo
    } else if (finalPaymentMethod === 'check') {
      console.log('WARNING: check selected but no checkInfo provided')
    }

    console.log('Final payment data being saved:', JSON.stringify(paymentData, null, 2))
    console.log('PaymentMethod value in paymentData:', paymentData.paymentMethod)

    const payment = await Payment.create(paymentData)
    
    // Convert to plain object to ensure all fields are included
    const paymentObj = payment.toObject ? payment.toObject() : payment
    
    console.log('Payment created successfully:', {
      _id: paymentObj._id,
      paymentMethod: paymentObj.paymentMethod,
      amount: paymentObj.amount,
      hasCcInfo: !!paymentObj.ccInfo,
      ccInfo: paymentObj.ccInfo,
      fullPaymentObject: JSON.stringify(paymentObj, null, 2)
    })

    return NextResponse.json(paymentObj, { status: 201 })
  } catch (error: any) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment', details: error.message },
      { status: 500 }
    )
  }
}

