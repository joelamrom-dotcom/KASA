import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Payment, Family } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - Split payment across multiple families
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { totalAmount, splits, paymentDate, notes } = body

    // splits: [{ familyId, amount, percentage }]
    if (!totalAmount || !splits || splits.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const totalSplit = splits.reduce((sum: number, split: any) => sum + (split.amount || 0), 0)
    if (Math.abs(totalSplit - totalAmount) > 0.01) {
      return NextResponse.json({ error: 'Split amounts must equal total amount' }, { status: 400 })
    }

    const createdPayments: any[] = []

    for (const split of splits) {
      const payment = await Payment.create({
        familyId: split.familyId,
        amount: split.amount,
        paymentDate: new Date(paymentDate),
        year: new Date(paymentDate).getFullYear(),
        type: 'membership',
        paymentMethod: 'split',
        notes: `${notes || ''} (Split payment ${split.percentage || ''}%)`.trim()
      })

      createdPayments.push(payment)
    }

    return NextResponse.json({
      success: true,
      payments: createdPayments,
      totalAmount
    })
  } catch (error: any) {
    console.error('Error splitting payment:', error)
    return NextResponse.json(
      { error: 'Failed to split payment', details: error.message },
      { status: 500 }
    )
  }
}

