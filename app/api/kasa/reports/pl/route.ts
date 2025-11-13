import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Payment, LifecycleEventPayment, Family, PaymentPlan } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Get P&L report data
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const year = searchParams.get('year')

    let dateFilter: any = {}
    
    if (year) {
      // Filter by year
      const yearNum = parseInt(year)
      dateFilter = {
        $or: [
          { year: yearNum },
          { 
            paymentDate: { 
              $gte: new Date(yearNum, 0, 1), 
              $lte: new Date(yearNum, 11, 31, 23, 59, 59) 
            } 
          },
          { 
            eventDate: { 
              $gte: new Date(yearNum, 0, 1), 
              $lte: new Date(yearNum, 11, 31, 23, 59, 59) 
            } 
          }
        ]
      }
    } else if (startDate && endDate) {
      // Filter by date range
      dateFilter = {
        $or: [
          { 
            paymentDate: { 
              $gte: new Date(startDate), 
              $lte: new Date(endDate) 
            } 
          },
          { 
            eventDate: { 
              $gte: new Date(startDate), 
              $lte: new Date(endDate) 
            } 
          }
        ]
      }
    }

    // Get all payments (Income)
    const payments = await Payment.find(
      year 
        ? { year: parseInt(year) }
        : startDate && endDate
        ? { paymentDate: { $gte: new Date(startDate), $lte: new Date(endDate) } }
        : {}
    )
      .populate('familyId', 'name')
      .sort({ paymentDate: 1 })

    // Get all lifecycle events (Expenses)
    const events = await LifecycleEventPayment.find(
      year
        ? { year: parseInt(year) }
        : startDate && endDate
        ? { eventDate: { $gte: new Date(startDate), $lte: new Date(endDate) } }
        : {}
    )
      .populate('familyId', 'name')
      .sort({ eventDate: 1 })

    // Calculate totals
    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0)
    const totalExpenses = events.reduce((sum, e) => sum + e.amount, 0)
    const netProfit = totalIncome - totalExpenses

    // Format payments for CSV
    const paymentRows = payments.map((payment: any) => ({
      type: 'Income',
      date: payment.paymentDate,
      year: payment.year,
      family: payment.familyId?.name || 'Unknown Family',
      description: `Payment - ${payment.type || 'membership'}`,
      amount: payment.amount,
      notes: payment.notes || ''
    }))

    // Format events for CSV
    const eventRows = events.map((event: any) => ({
      type: 'Expense',
      date: event.eventDate,
      year: event.year,
      family: event.familyId?.name || 'Unknown Family',
      description: `${event.eventType} - ${event.notes || ''}`,
      amount: -event.amount, // Negative for expenses
      notes: event.notes || ''
    }))

    // Combine and sort by date
    const allTransactions = [...paymentRows, ...eventRows].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return NextResponse.json({
      transactions: allTransactions,
      summary: {
        totalIncome,
        totalExpenses,
        netProfit,
        transactionCount: allTransactions.length,
        paymentCount: payments.length,
        eventCount: events.length
      },
      payments: paymentRows,
      events: eventRows
    })
  } catch (error: any) {
    console.error('Error generating P&L report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message },
      { status: 500 }
    )
  }
}

