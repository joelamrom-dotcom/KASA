import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { YearlyCalculation, Family, Payment } from '@/lib/models'
import { getAuthenticatedUser, isSuperAdmin } from '@/lib/middleware'
import { calculateYearlyIncome } from '@/lib/calculations'

// GET - Get yearly calculations (user-scoped)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    
    // For super_admin, show all calculations
    // For other users, calculate based on their own families/payments
    const isSuperAdminUser = isSuperAdmin(user)
    
    if (year) {
      const yearNum = parseInt(year)
      
      // If super_admin, try to get global calculation first
      if (isSuperAdminUser) {
        const calculation = await YearlyCalculation.findOne({ year: yearNum })
        if (calculation) {
          return NextResponse.json(calculation)
        }
      }
      
      // Calculate user-specific income for the year
      // This will filter families/payments by userId
      const userFamilies = await Family.find(
        isSuperAdminUser ? {} : { userId: user.userId }
      )
      
      // Calculate income based on user's families
      const calculationData = await calculateYearlyIncome(yearNum, 0, user.userId)
      
      return NextResponse.json({
        year: yearNum,
        calculatedIncome: calculationData.calculatedIncome || 0,
        calculatedExpenses: calculationData.calculatedExpenses || 0,
        balance: calculationData.balance || 0,
        ...calculationData
      })
    }
    
    // Get all calculations (for super_admin) or calculate for current user
    if (isSuperAdminUser) {
      const calculations = await YearlyCalculation.find({}).sort({ year: -1 })
      return NextResponse.json(calculations)
    } else {
      // For regular users, calculate for recent years
      const currentYear = new Date().getFullYear()
      const years = [currentYear, currentYear - 1, currentYear - 2]
      const calculations = []
      
      for (const y of years) {
        const calcData = await calculateYearlyIncome(y, 0, user.userId)
        calculations.push({
          year: y,
          calculatedIncome: calcData.calculatedIncome || 0,
          calculatedExpenses: calcData.calculatedExpenses || 0,
          balance: calcData.balance || 0,
          ...calcData
        })
      }
      
      return NextResponse.json(calculations)
    }
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

