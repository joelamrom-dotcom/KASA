import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/middleware'
import { createPaymentIntentForUser } from '@/lib/stripe-helpers'

export async function POST(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, familyId, description } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Create payment intent using user's admin's Stripe account
    const paymentIntent = await createPaymentIntentForUser(
      user.userId,
      amount,
      'usd',
      {
        familyId: familyId || '',
        description: description || `Payment for family ${familyId}`,
      },
      familyId || undefined // Pass familyId to use family's admin
    )

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Failed to create payment intent. Please ensure your Stripe account is connected in Settings.' },
        { status: 500 }
      )
    }

    console.log('Payment intent created successfully:', paymentIntent.id)
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create payment intent',
        details: process.env.NODE_ENV === 'development' ? {
          type: error.type,
          code: error.code,
          statusCode: error.statusCode
        } : undefined
      },
      { status: 500 }
    )
  }
}

