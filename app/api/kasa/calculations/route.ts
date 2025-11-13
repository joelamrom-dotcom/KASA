import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { YearlyCalculation } from '@/lib/models'
import { calculateAndSaveYear } from '@/lib/calculations'

// GET - Get yearly calculations
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    
    if (year) {
      const calculation = await YearlyCalculation.findOne({ year: parseInt(year) })
      if (!calculation) {
        return NextResponse.json(
          { error: `No calculation found for year ${year}` },
          { status: 404 }
        )
      }
      return NextResponse.json(calculation)
    }
    
    // Get all calculations
    const calculations = await YearlyCalculation.find({}).sort({ year: -1 })
    return NextResponse.json(calculations)
  } catch (error: any) {
    console.error('Error fetching calculations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calculations', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Calculate and save for a specific year
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { year, extraDonation = 0, extraExpense = 0 } = body

    if (!year) {
      return NextResponse.json(
        { error: 'Year is required' },
        { status: 400 }
      )
    }

    const calculation = await calculateAndSaveYear(
      parseInt(year),
      extraDonation || 0,
      extraExpense || 0
    )

    return NextResponse.json(calculation, { status: 201 })
  } catch (error: any) {
    console.error('Error calculating year:', error)
    return NextResponse.json(
      { error: 'Failed to calculate year', details: error.message },
      { status: 500 }
    )
  }
}

