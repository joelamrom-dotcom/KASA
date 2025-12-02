import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Payment, LifecycleEventPayment, Withdrawal, Family } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Profit & Loss statement
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || 'monthly'

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const families = await Family.find({ userId }).select('_id').lean()
    const familyIds = families.map((f: any) => f._id)

    const dateQuery: any = {}
    if (startDate) dateQuery.$gte = new Date(startDate)
    if (endDate) dateQuery.$lte = new Date(endDate)

    // Get revenue (payments)
    const payments = await Payment.find({
      familyId: { $in: familyIds },
      ...(Object.keys(dateQuery).length > 0 ? { paymentDate: dateQuery } : {})
    }).lean()

    const revenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

    // Get expenses (lifecycle events, withdrawals)
    const events = await LifecycleEventPayment.find({
      familyId: { $in: familyIds },
      ...(Object.keys(dateQuery).length > 0 ? { eventDate: dateQuery } : {})
    }).lean()

    const withdrawals = await Withdrawal.find({
      familyId: { $in: familyIds },
      ...(Object.keys(dateQuery).length > 0 ? { withdrawalDate: dateQuery } : {})
    }).lean()

    const expenses = events.reduce((sum, e) => sum + (e.amount || 0), 0) +
                     withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0)

    const profit = revenue - expenses

    return NextResponse.json({
      period: {
        startDate: startDate || null,
        endDate: endDate || null
      },
      revenue: {
        total: revenue,
        breakdown: {
          membership: revenue,
          donations: 0,
          other: 0
        }
      },
      expenses: {
        total: expenses,
        breakdown: {
          lifecycleEvents: events.reduce((sum, e) => sum + (e.amount || 0), 0),
          withdrawals: withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0),
          other: 0
        }
      },
      profit: {
        total: profit,
        margin: revenue > 0 ? (profit / revenue) * 100 : 0
      }
    })
  } catch (error: any) {
    console.error('Error generating P&L:', error)
    return NextResponse.json(
      { error: 'Failed to generate P&L', details: error.message },
      { status: 500 }
    )
  }
}

