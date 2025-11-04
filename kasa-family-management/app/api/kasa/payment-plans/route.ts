import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { PaymentPlan } from '@/lib/models'

// GET - Get all payment plans
export async function GET() {
  try {
    await connectDB()
    const plans = await PaymentPlan.find({}).sort({ ageStart: 1 })
    return NextResponse.json(plans)
  } catch (error: any) {
    console.error('Error fetching payment plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment plans', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new payment plan
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { name, ageStart, ageEnd, yearlyPrice } = body

    if (!name || ageStart === undefined || !yearlyPrice) {
      return NextResponse.json(
        { error: 'Name, ageStart, and yearlyPrice are required' },
        { status: 400 }
      )
    }

    const plan = await PaymentPlan.create({
      name,
      ageStart,
      ageEnd: ageEnd || null,
      yearlyPrice
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error: any) {
    console.error('Error creating payment plan:', error)
    return NextResponse.json(
      { error: 'Failed to create payment plan', details: error.message },
      { status: 500 }
    )
  }
}

