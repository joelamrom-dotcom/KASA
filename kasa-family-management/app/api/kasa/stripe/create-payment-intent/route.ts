import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import https from 'https'

// Initialize Stripe at module level (same as other routes)
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set in environment variables')
}

// Create HTTPS agent that handles SSL certificates properly
// In development, allow self-signed certificates (for testing behind proxies/firewalls)
// In production, use default strict certificate validation
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production',
})

// Initialize Stripe - use default API version and HTTP client
let stripe: Stripe | null = null

if (process.env.STRIPE_SECRET_KEY) {
  try {
    console.log('Initializing Stripe with key prefix:', process.env.STRIPE_SECRET_KEY.substring(0, 20))
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // Let Stripe use default API version
      maxNetworkRetries: 2,
      timeout: 30000,
      httpAgent: httpsAgent,
    })
    console.log('Stripe initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Stripe:', error)
  }
} else {
  console.error('STRIPE_SECRET_KEY not found in environment')
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      console.error('Stripe is not initialized - STRIPE_SECRET_KEY missing')
      return NextResponse.json(
        { error: 'Stripe is not configured. Please check server environment variables and restart the server.' },
        { status: 500 }
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

    // Create a PaymentIntent with the order amount and currency
    console.log('Creating payment intent with:', { amount, familyId, description })
    console.log('Stripe instance created, making API call...')
    console.log('Stripe key prefix:', process.env.STRIPE_SECRET_KEY?.substring(0, 20))
    
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        description: description || `Payment for family ${familyId}`,
        metadata: {
          familyId: familyId || '',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })

      console.log('Payment intent created successfully:', paymentIntent.id)
      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      })
    } catch (stripeError: any) {
      console.error('Stripe API call failed:', stripeError)
      console.error('Stripe error type:', stripeError.type)
      console.error('Stripe error code:', stripeError.code)
      console.error('Stripe error message:', stripeError.message)
      if (stripeError.type === 'StripeConnectionError') {
        console.error('Connection error - this usually means:')
        console.error('1. Network connectivity issue')
        console.error('2. Firewall/proxy blocking Stripe API')
        console.error('3. DNS resolution problem')
        console.error('4. Stripe API endpoint unreachable')
      }
      throw stripeError // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      raw: error.raw
    })
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

