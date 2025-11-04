import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Statement, Family, Payment, Withdrawal, LifecycleEventPayment } from '@/lib/models'
import { calculateFamilyBalance } from '@/lib/calculations'

// GET - Get all statements or filter by family
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const searchParams = request.nextUrl.searchParams
    const familyId = searchParams.get('familyId')
    
    let query: any = {}
    if (familyId) {
      query.familyId = familyId
    }
    
    const statements = await Statement.find(query).sort({ date: -1 })
    return NextResponse.json(statements)
  } catch (error: any) {
    console.error('Error fetching statements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statements', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Generate a new statement for a family
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { familyId, fromDate, toDate } = body

    if (!familyId || !fromDate || !toDate) {
      return NextResponse.json(
        { error: 'Family ID, from date, and to date are required' },
        { status: 400 }
      )
    }

    const family = await Family.findById(familyId)
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const from = new Date(fromDate)
    const to = new Date(toDate)

    // Get opening balance (balance before fromDate)
    const openingBalanceData = await calculateFamilyBalance(familyId, new Date(from.getTime() - 1))
    const openingBalance = openingBalanceData.balance

    // Get payments in date range
    const payments = await Payment.find({
      familyId,
      paymentDate: { $gte: from, $lte: to }
    })
    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0)

    // Get withdrawals in date range
    const withdrawals = await Withdrawal.find({
      familyId,
      withdrawalDate: { $gte: from, $lte: to }
    })
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0)

    // Get lifecycle events in date range
    const lifecycleEvents = await LifecycleEventPayment.find({
      familyId,
      eventDate: { $gte: from, $lte: to }
    })
    const totalExpenses = lifecycleEvents.reduce((sum, e) => sum + e.amount, 0)

    // Calculate closing balance
    const closingBalance = openingBalance + totalIncome - totalWithdrawals - totalExpenses

    // Generate statement number
    const statementCount = await Statement.countDocuments({ familyId })
    const statementNumber = `STMT-${familyId.slice(-6)}-${statementCount + 1}`

    const statement = await Statement.create({
      familyId,
      statementNumber,
      date: new Date(),
      fromDate: from,
      toDate: to,
      openingBalance,
      income: totalIncome,
      withdrawals: totalWithdrawals,
      expenses: totalExpenses,
      closingBalance
    })

    return NextResponse.json(statement, { status: 201 })
  } catch (error: any) {
    console.error('Error generating statement:', error)
    return NextResponse.json(
      { error: 'Failed to generate statement', details: error.message },
      { status: 500 }
    )
  }
}

