import { NextRequest, NextResponse } from 'next/server'
import db from '../../../../lib/database-adapter.js'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pricePlan = await db.getPricePlanById(params.id)
    if (!pricePlan) {
      return NextResponse.json(
        { error: 'Price plan not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(pricePlan)
  } catch (error) {
    console.error('Error fetching price plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price plan' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, yearlyPrice, description, isActive } = body

    if (!title || !yearlyPrice) {
      return NextResponse.json(
        { error: 'Title and yearly price are required' },
        { status: 400 }
      )
    }

    const monthlyPrice = yearlyPrice / 12

    // Update price plan (we'll need to add this method to our optimized database)
    const updatedPlan = await db.updatePricePlan(params.id, {
      title,
      yearlyPrice: parseFloat(yearlyPrice),
      monthlyPrice,
      description: description || '',
      isActive: isActive !== undefined ? isActive : true
    })

    if (!updatedPlan) {
      return NextResponse.json(
        { error: 'Price plan not found' },
        { status: 404 }
      )
    }

    // Log activity
    await db.logActivity({
      userId: null,
      type: 'price_plan_updated',
      description: `Price plan "${title}" updated`,
      metadata: {
        pricePlanId: params.id,
        yearlyPrice: parseFloat(yearlyPrice)
      }
    })

    return NextResponse.json(updatedPlan)
  } catch (error) {
    console.error('Error updating price plan:', error)
    return NextResponse.json(
      { error: 'Failed to update price plan' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pricePlan = await db.getPricePlanById(params.id)
    if (!pricePlan) {
      return NextResponse.json(
        { error: 'Price plan not found' },
        { status: 404 }
      )
    }

    // Delete price plan (we'll need to add this method to our optimized database)
    await db.deletePricePlan(params.id)

    // Log activity
    await db.logActivity({
      userId: null,
      type: 'price_plan_deleted',
      description: `Price plan "${pricePlan.title}" deleted`,
      metadata: {
        pricePlanId: params.id
      }
    })

    return NextResponse.json({ message: 'Price plan deleted successfully' })
  } catch (error) {
    console.error('Error deleting price plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete price plan' },
      { status: 500 }
    )
  }
}
