import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { SavedPaymentMethod, Family } from '@/lib/models'
import Stripe from 'stripe'
import https from 'https'

// Create HTTPS agent that handles SSL certificates properly
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production',
})

// Initialize Stripe only when API key is available (lazy initialization)
function getStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(apiKey, {
    apiVersion: '2025-10-29.clover',
    httpAgent: httpsAgent,
  })
}

// GET - Get all saved payment methods for a family
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const paymentMethods = await SavedPaymentMethod.find({
      familyId: params.id,
      isActive: true
    }).sort({ isDefault: -1, createdAt: -1 })

    return NextResponse.json(paymentMethods)
  } catch (error: any) {
    console.error('Error fetching saved payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved payment methods', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Save a new payment method
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const body = await request.json()
    const { paymentMethodId, setAsDefault } = body

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      )
    }

    // Retrieve payment method from Stripe
    const stripe = getStripe()
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

    if (!paymentMethod.card) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults
    if (setAsDefault) {
      await SavedPaymentMethod.updateMany(
        { familyId: params.id },
        { isDefault: false }
      )
    }

    // Check if this payment method already exists
    const existing = await SavedPaymentMethod.findOne({
      familyId: params.id,
      stripePaymentMethodId: paymentMethodId
    })

    if (existing) {
      // Update existing
      existing.isDefault = setAsDefault || false
      existing.isActive = true
      await existing.save()
      return NextResponse.json(existing)
    }

    // Create new saved payment method
    const savedPaymentMethod = await SavedPaymentMethod.create({
      familyId: params.id,
      stripePaymentMethodId: paymentMethodId,
      last4: paymentMethod.card.last4,
      cardType: paymentMethod.card.brand,
      expiryMonth: paymentMethod.card.exp_month,
      expiryYear: paymentMethod.card.exp_year,
      nameOnCard: paymentMethod.billing_details?.name || undefined,
      isDefault: setAsDefault || false,
      isActive: true
    })

    return NextResponse.json(savedPaymentMethod, { status: 201 })
  } catch (error: any) {
    console.error('Error saving payment method:', error)
    return NextResponse.json(
      { error: 'Failed to save payment method', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Remove a saved payment method
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const searchParams = request.nextUrl.searchParams
    const paymentMethodId = searchParams.get('paymentMethodId')

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      )
    }

    await SavedPaymentMethod.findByIdAndUpdate(paymentMethodId, {
      isActive: false
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment method', details: error.message },
      { status: 500 }
    )
  }
}

