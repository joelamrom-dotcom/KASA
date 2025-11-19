import { NextRequest, NextResponse } from 'next/server'
import { generateMonthlyStatements } from '@/lib/scheduler'
import connectDB from '@/lib/database'
import { AutomationSettings } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

// POST - Auto-generate monthly statements (can be called by cron job)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Check if automation is enabled (if user is authenticated)
    try {
      const user = getAuthenticatedUser(request)
      if (user) {
        const mongoose = require('mongoose')
        const userObjectId = new mongoose.Types.ObjectId(user.userId)
        const automationSettings = await AutomationSettings.findOne({ userId: userObjectId })
        
        if (automationSettings && !automationSettings.enableStatementGeneration) {
          return NextResponse.json({
            success: false,
            message: 'Statement generation automation is disabled for this account',
            generated: 0
          })
        }
      }
    } catch (authError) {
      // If no auth, continue (cron jobs may not have auth)
    }
    
    const result = await generateMonthlyStatements()
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error auto-generating statements:', error)
    return NextResponse.json(
      { error: 'Failed to auto-generate statements', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Generate statements for a specific month
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined

    const result = await generateMonthlyStatements(year, month)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error generating statements:', error)
    return NextResponse.json(
      { error: 'Failed to generate statements', details: error.message },
      { status: 500 }
    )
  }
}

