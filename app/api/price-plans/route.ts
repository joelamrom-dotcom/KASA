import { NextRequest, NextResponse } from 'next/server'
import db from '../../../lib/database-adapter.js'

export async function GET() {
  try {
    const pricePlans = await db.getPricePlans()
    return NextResponse.json(pricePlans)
  } catch (error) {
    console.error('Error fetching price plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price plans' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, yearlyPrice, description } = body

    if (!title || !yearlyPrice) {
      return NextResponse.json(
        { error: 'Title and yearly price are required' },
        { status: 400 }
      )
    }

    const monthlyPrice = yearlyPrice / 12

    const pricePlan = await db.createPricePlan({
      title,
      yearlyPrice: parseFloat(yearlyPrice),
      monthlyPrice,
      description: description || '',
      isActive: true
    })

    // Log activity
    await db.logActivity({
      userId: null,
      type: 'price_plan_created',
      description: `Price plan "${title}" created with yearly price $${yearlyPrice}`,
      metadata: {
        pricePlanId: pricePlan.id,
        yearlyPrice: parseFloat(yearlyPrice)
      }
    })

    return NextResponse.json(pricePlan, { status: 201 })
  } catch (error) {
    console.error('Error creating price plan:', error)
    return NextResponse.json(
      { error: 'Failed to create price plan' },
      { status: 500 }
    )
  }
}
