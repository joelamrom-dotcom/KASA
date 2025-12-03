import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, PaymentPlan } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - Auto-generate invoices from payment plans
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { period = 'monthly', familyIds, templateId } = body

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    const query: any = { userId }
    if (familyIds && familyIds.length > 0) {
      query._id = { $in: familyIds.map((id: string) => new mongoose.Types.ObjectId(id)) }
    }

    const families = await Family.find(query)
      .populate('paymentPlanId')
      .lean()

    const invoices: any[] = []

    for (const familyDoc of families) {
      const family = familyDoc as any
      const paymentPlan = family.paymentPlanId as any
      if (!paymentPlan) continue

      const amount = paymentPlan.yearlyPrice || 0
      const monthlyAmount = amount / 12

      const invoice = {
        invoiceNumber: `INV-${family._id}-${Date.now()}`,
        familyId: family._id.toString(),
        familyName: family.name,
        items: [{
          description: `Membership fee - ${paymentPlan.name || 'Payment Plan'}`,
          amount: period === 'monthly' ? monthlyAmount : amount,
          quantity: 1
        }],
        total: period === 'monthly' ? monthlyAmount : amount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft',
        period
      }

      invoices.push(invoice)
    }

    return NextResponse.json({
      success: true,
      invoices,
      count: invoices.length
    })
  } catch (error: any) {
    console.error('Error auto-generating invoices:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoices', details: error.message },
      { status: 500 }
    )
  }
}

