import { NextRequest, NextResponse } from 'next/server'
import db from '../../../../../lib/database-adapter.js'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { memberId, startDate } = body

    if (!memberId || !startDate) {
      return NextResponse.json(
        { error: 'Member ID and start date are required' },
        { status: 400 }
      )
    }

    // Create subscription
    const subscription = await db.createSubscription({
      memberId,
      pricePlanId: params.id,
      startDate
    })

    return NextResponse.json({
      message: 'Statements generated successfully',
      subscription: subscription.subscription,
      statement: subscription.statement
    }, { status: 201 })

  } catch (error) {
    console.error('Generate statements error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
