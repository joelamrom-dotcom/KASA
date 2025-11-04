import { NextRequest, NextResponse } from 'next/server'
import db from '../../../lib/database-adapter.js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    if (memberId) {
      // Get subscriptions by familyId (member belongs to a family)
      const subscriptions = await db.getSubscriptionsByFamilyId(memberId)
      return NextResponse.json({ subscriptions: Array.isArray(subscriptions) ? subscriptions : [] })
    }

        // Get all subscriptions using find method
    const subscriptions = await db.getSubscriptionsByFamilyId(null) || []
    
    return NextResponse.json({ subscriptions: Array.isArray(subscriptions) ? subscriptions : [] })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.memberId || !body.pricePlanId) {
      return NextResponse.json(
        { error: 'Member ID and Price Plan ID are required' },
        { status: 400 }
      )
    }

    // Create subscription
    const subscription = await db.createSubscription(body)
    
    // Generate first month statement if needed
    const result = {
      subscription: subscription,
      statement: null // Statement generation would need to be implemented separately
    }

    // Log activity
    await db.logActivity({
      userId: body.createdBy || null,
      type: 'subscription_created',
      description: `New subscription created for member ${body.memberId}`,
      metadata: {
        memberId: body.memberId,
        pricePlanId: body.pricePlanId,
        subscriptionId: result.subscription.id,
        monthlyAmount: result.subscription.monthlyAmount
      }
    })

    return NextResponse.json({
      message: 'Subscription created successfully',
      subscription: result.subscription,
      firstStatement: result.statement
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.action === 'generate-next-month') {
      const { subscriptionId } = body
      
      if (!subscriptionId) {
        return NextResponse.json(
          { error: 'Subscription ID is required' },
          { status: 400 }
        )
      }

      // Generate next month statement - simplified
      // This would need proper implementation with date logic
      const subscriptions = await db.getSubscriptionsByFamilyId(null) || []
      const subscription = Array.isArray(subscriptions) 
        ? subscriptions.find((s: any) => s.id === subscriptionId || s._id === subscriptionId)
        : null
      
      if (!subscription) {
        return NextResponse.json(
          { error: 'Subscription not found' },
          { status: 404 }
        )
      }
      
      // Create next month statement
      const nextStatement = await db.createStatement({
        subscriptionId: subscriptionId,
        memberId: subscription.memberId,
        familyId: subscription.familyId,
        amount: subscription.monthlyAmount || 0,
        monthNumber: (subscription.currentMonthNumber || 0) + 1,
        status: 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })

      // Log activity
      await db.logActivity({
        userId: body.generatedBy || null,
        type: 'next_month_statement_generated',
        description: `Next month statement generated for subscription ${subscriptionId}`,
        metadata: {
          subscriptionId,
          statementId: nextStatement.id,
          monthNumber: nextStatement.monthNumber,
          amount: nextStatement.amount
        }
      })

      return NextResponse.json({
        message: 'Next month statement generated successfully',
        statement: nextStatement
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "generate-next-month" to create next month statement.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error generating next month statement:', error)
    return NextResponse.json(
      { error: 'Failed to generate next month statement' },
      { status: 500 }
    )
  }
}
