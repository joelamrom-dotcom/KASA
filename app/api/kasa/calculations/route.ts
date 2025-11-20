import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { YearlyCalculation, Family, Payment } from '@/lib/models'
import { getAuthenticatedUser, isSuperAdmin } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { calculateYearlyIncome, calculateAndSaveYear } from '@/lib/calculations'

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
    
    // Check permission - users with analytics.view see all calculations
    const canViewAll = await hasPermission(user, PERMISSIONS.ANALYTICS_VIEW)
    const isSuperAdminUser = isSuperAdmin(user)
    
    if (year) {
      const yearNum = parseInt(year)
      
      // If user has analytics view permission or is super_admin, try to get global calculation first
      if (canViewAll || isSuperAdminUser) {
        const calculation = await YearlyCalculation.findOne({ year: yearNum })
        if (calculation) {
          return NextResponse.json(calculation)
        }
      }
      
      // Calculate user-specific income for the year
      // This will filter families/payments by userId
      const userFamilies = await Family.find(
        (canViewAll || isSuperAdminUser) ? {} : { userId: user.userId }
      )
      
      // Calculate income based on user's families
      const calculationData = await calculateYearlyIncome(yearNum, 0, user.userId)
      
      // Return calculation data with year and ensure calculatedIncome exists
      // Note: calculateYearlyIncome doesn't return calculatedExpenses or balance,
      // those are only in YearlyCalculation model
      return NextResponse.json({
        year: yearNum,
        ...calculationData,
        calculatedIncome: calculationData.calculatedIncome ?? 0,
        calculatedExpenses: 0, // Not calculated by calculateYearlyIncome
        balance: 0 // Not calculated by calculateYearlyIncome
      })
    }
    
    // Get all calculations (for users with analytics.view or super_admin) or calculate for current user
    if (canViewAll || isSuperAdminUser) {
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
          ...calcData,
          // Ensure these fields exist (they should be in calcData, but provide defaults)
          calculatedIncome: calcData.calculatedIncome ?? 0,
          calculatedExpenses: 0, // Not calculated by calculateYearlyIncome
          balance: 0 // Not calculated by calculateYearlyIncome
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

