import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, Statement, Payment, LifecycleEventPayment } from '@/lib/models'

export const dynamic = 'force-dynamic'

// POST - Auto-generate statements for families
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { period = 'monthly', sendEmails = false, familyIds } = body

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Get families
    const query: any = { userId }
    if (familyIds && familyIds.length > 0) {
      query._id = { $in: familyIds.map((id: string) => new mongoose.Types.ObjectId(id)) }
    }

    const families = await Family.find(query).lean()
    const generatedStatements: any[] = []

    const now = new Date()
    let startDate: Date
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), 0) // Last day of previous month

    if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    } else if (period === 'quarterly') {
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
    } else {
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31)
    }

    for (const family of families) {
      const familyId = family._id

      // Get payments in period
      const payments = await Payment.find({
        familyId,
        paymentDate: { $gte: startDate, $lte: endDate }
      }).lean()

      // Get lifecycle events in period
      const events = await LifecycleEventPayment.find({
        familyId,
        eventDate: { $gte: startDate, $lte: endDate }
      }).lean()

      const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
      const totalEvents = events.reduce((sum, e) => sum + (e.amount || 0), 0)

      // Create statement
      const statement = await Statement.create({
        userId,
        familyId,
        period,
        startDate,
        endDate,
        totalPayments,
        totalEvents,
        balance: (family as any).openBalance || 0,
        status: 'draft'
      })

      generatedStatements.push({
        statementId: statement._id.toString(),
        familyName: (family as any).name,
        period,
        totalPayments,
        totalEvents
      })

      // Send email if requested
      if (sendEmails && (family as any).email && (family as any).receiveEmails !== false) {
        try {
          const { sendEmail } = await import('@/lib/email-helpers')
          const subject = `Statement for ${(family as any).name} - ${period}`
          const html = `
            <h2>Statement for ${(family as any).name}</h2>
            <p>Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</p>
            <p>Total Payments: $${totalPayments.toLocaleString()}</p>
            <p>Current Balance: $${((family as any).openBalance || 0).toLocaleString()}</p>
          `
          await sendEmail((family as any).email, subject, html)
        } catch (emailError) {
          console.error(`Error sending statement email to ${(family as any).email}:`, emailError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      generated: generatedStatements.length,
      statements: generatedStatements
    })
  } catch (error: any) {
    console.error('Error auto-generating statements:', error)
    return NextResponse.json(
      { error: 'Failed to generate statements', details: error.message },
      { status: 500 }
    )
  }
}
