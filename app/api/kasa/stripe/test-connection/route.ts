import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY
    
    if (!secretKey) {
      return NextResponse.json({
        error: 'STRIPE_SECRET_KEY not found in environment variables',
        configured: false
      }, { status: 500 })
    }

    if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
      return NextResponse.json({
        error: 'Invalid Stripe key format',
        configured: false,
        keyPrefix: secretKey.substring(0, 10)
      }, { status: 500 })
    }

    // Try to initialize Stripe
    const stripe = new Stripe(secretKey, {
      timeout: 10000,
      maxNetworkRetries: 1
    })

    // Try a simple API call to verify the connection
    try {
      // This is a lightweight call that just verifies the key is valid
      const account = await stripe.account.retrieve()
      
      return NextResponse.json({
        success: true,
        configured: true,
        accountId: account.id,
        message: 'Stripe connection successful'
      })
    } catch (stripeError: any) {
      return NextResponse.json({
        error: 'Stripe API call failed',
        configured: true,
        stripeError: {
          type: stripeError.type,
          code: stripeError.code,
          message: stripeError.message
        }
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to test Stripe connection',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

