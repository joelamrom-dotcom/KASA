import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, Payment, Withdrawal } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Balance Sheet
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const asOfDate = searchParams.get('asOfDate') || new Date().toISOString()

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const families = await Family.find({ userId }).lean()
    const familyIds = families.map((f: any) => f._id)

    const dateQuery = { $lte: new Date(asOfDate) }

    // Assets (Cash/Receivables)
    const payments = await Payment.find({
      familyId: { $in: familyIds },
      paymentDate: dateQuery
    }).lean()

    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

    const withdrawals = await Withdrawal.find({
      familyId: { $in: familyIds },
      withdrawalDate: dateQuery
    }).lean()

    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0)

    // Calculate accounts receivable (unpaid balances)
    const totalReceivables = families.reduce((sum, f: any) => sum + (f.openBalance || 0), 0)

    const assets = {
      cash: totalPayments - totalWithdrawals,
      receivables: totalReceivables,
      total: (totalPayments - totalWithdrawals) + totalReceivables
    }

    // Liabilities (would include payables, loans, etc.)
    const liabilities = {
      payables: 0,
      loans: 0,
      total: 0
    }

    // Equity
    const equity = {
      retainedEarnings: assets.total - liabilities.total,
      total: assets.total - liabilities.total
    }

    return NextResponse.json({
      asOfDate,
      assets,
      liabilities,
      equity,
      balance: assets.total === (liabilities.total + equity.total)
    })
  } catch (error: any) {
    console.error('Error generating balance sheet:', error)
    return NextResponse.json(
      { error: 'Failed to generate balance sheet', details: error.message },
      { status: 500 }
    )
  }
}

