import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Statement } from '@/lib/models'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    await connectDB()
    
    const statements = await Statement.find({ memberId: params.memberId })
      .sort({ date: -1 })
      .lean()
    
    return NextResponse.json(statements)
  } catch (error: any) {
    console.error('Error fetching member statements:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch member statements' },
      { status: 500 }
    )
  }
}

// POST - Generate a new statement for a member
export async function POST(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    await connectDB()
    const body = await request.json()
    const { fromDate, toDate } = body

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: 'From date and to date are required' },
        { status: 400 }
      )
    }

    const { FamilyMember, Payment, LifecycleEventPayment, Statement } = await import('@/lib/models')
    const { calculateMemberBalance } = await import('@/lib/calculations')

    const member = await FamilyMember.findById(params.memberId)
    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    const from = new Date(fromDate)
    const to = new Date(toDate)

    // Get opening balance (balance before fromDate)
    const openingBalanceData = await calculateMemberBalance(params.memberId, new Date(from.getTime() - 1))
    const openingBalance = openingBalanceData.balance

    // Get payments in date range
    const payments = await Payment.find({
      memberId: params.memberId,
      paymentDate: { $gte: from, $lte: to }
    })
    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0)

    // Get lifecycle events in date range (for display only, not included in balance)
    const lifecycleEvents = await LifecycleEventPayment.find({
      memberId: params.memberId,
      eventDate: { $gte: from, $lte: to }
    })
    const totalExpenses = lifecycleEvents.reduce((sum, e) => sum + e.amount, 0)

    // Calculate closing balance (lifecycle events are NOT subtracted from balance)
    const closingBalance = openingBalance + totalIncome

    // Generate statement number
    const statementCount = await Statement.countDocuments({ memberId: params.memberId })
    const statementNumber = `STMT-MEM-${params.memberId.slice(-6)}-${statementCount + 1}`

    const statement = await Statement.create({
      familyId: member.familyId,
      memberId: params.memberId,
      statementNumber,
      date: new Date(),
      fromDate: from,
      toDate: to,
      openingBalance,
      income: totalIncome,
      withdrawals: 0, // Members don't have withdrawals
      expenses: totalExpenses,
      closingBalance
    })

    return NextResponse.json(statement, { status: 201 })
  } catch (error: any) {
    console.error('Error generating member statement:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate member statement' },
      { status: 500 }
    )
  }
}

