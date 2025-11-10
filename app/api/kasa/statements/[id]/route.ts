import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Statement, Payment, LifecycleEventPayment, Withdrawal } from '@/lib/models'

// GET - Get statement details with all transactions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const statement = await Statement.findById(params.id)
    if (!statement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      )
    }

    // Get all payments in the statement period
    const payments = await Payment.find({
      familyId: statement.familyId,
      paymentDate: { $gte: statement.fromDate, $lte: statement.toDate }
    }).sort({ paymentDate: 1 })

    // Get all withdrawals in the statement period
    const withdrawals = await Withdrawal.find({
      familyId: statement.familyId,
      withdrawalDate: { $gte: statement.fromDate, $lte: statement.toDate }
    }).sort({ withdrawalDate: 1 })

    // Get all lifecycle events in the statement period
    const events = await LifecycleEventPayment.find({
      familyId: statement.familyId,
      eventDate: { $gte: statement.fromDate, $lte: statement.toDate }
    }).sort({ eventDate: 1 })

    // Combine all transactions and sort by date
    const transactions = [
      ...payments.map((p: any) => ({
        type: 'payment',
        date: p.paymentDate,
        description: `Payment - ${p.type || 'membership'}`,
        amount: p.amount,
        notes: p.notes || ''
      })),
      ...withdrawals.map((w: any) => ({
        type: 'withdrawal',
        date: w.withdrawalDate,
        description: `Withdrawal - ${w.reason}`,
        amount: -w.amount,
        notes: ''
      })),
      ...events.map((e: any) => ({
        type: 'event',
        date: e.eventDate,
        description: `${e.eventType} - ${e.notes || ''}`,
        amount: -e.amount,
        notes: e.notes || ''
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json({
      statement,
      transactions
    })
  } catch (error: any) {
    console.error('Error fetching statement details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statement details', details: error.message },
      { status: 500 }
    )
  }
}

