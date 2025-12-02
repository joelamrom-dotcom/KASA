import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Payment, LifecycleEventPayment, Withdrawal, Family } from '@/lib/models'

export const dynamic = 'force-dynamic'

// GET - Cash Flow Statement
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

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const families = await Family.find({ userId }).select('_id').lean()
    const familyIds = families.map((f: any) => f._id)

    const dateQuery: any = {}
    if (startDate) dateQuery.$gte = new Date(startDate)
    if (endDate) dateQuery.$lte = new Date(endDate)

    // Operating Activities
    const payments = await Payment.find({
      familyId: { $in: familyIds },
      ...(Object.keys(dateQuery).length > 0 ? { paymentDate: dateQuery } : {})
    }).lean()

    const operatingInflow = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

    const events = await LifecycleEventPayment.find({
      familyId: { $in: familyIds },
      ...(Object.keys(dateQuery).length > 0 ? { eventDate: dateQuery } : {})
    }).lean()

    const operatingOutflow = events.reduce((sum, e) => sum + (e.amount || 0), 0)

    const operatingCashFlow = operatingInflow - operatingOutflow

    // Investing Activities (would include equipment, investments, etc.)
    const investingCashFlow = 0

    // Financing Activities (would include loans, equity, etc.)
    const financingCashFlow = 0

    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow

    return NextResponse.json({
      period: {
        startDate: startDate || null,
        endDate: endDate || null
      },
      operating: {
        inflow: operatingInflow,
        outflow: operatingOutflow,
        net: operatingCashFlow
      },
      investing: {
        inflow: 0,
        outflow: 0,
        net: investingCashFlow
      },
      financing: {
        inflow: 0,
        outflow: 0,
        net: financingCashFlow
      },
      netCashFlow
    })
  } catch (error: any) {
    console.error('Error generating cash flow:', error)
    return NextResponse.json(
      { error: 'Failed to generate cash flow', details: error.message },
      { status: 500 }
    )
  }
}

