import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { checkAndUpdateAllPaymentPlans } from '@/lib/payment-plan-auto-adjust'

// POST - Manually trigger payment plan updates for all families
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update payment plans
    // For now, allow all authenticated users (you can add permission checks later)
    
    const results = await checkAndUpdateAllPaymentPlans(user.userId)

    return NextResponse.json({
      success: true,
      message: `Checked ${results.checked} members, updated ${results.updated} payment plans`,
      results: {
        checked: results.checked,
        updated: results.updated,
        details: results.results
      }
    })
  } catch (error: any) {
    console.error('Error updating payment plans:', error)
    return NextResponse.json(
      { error: 'Failed to update payment plans', details: error.message },
      { status: 500 }
    )
  }
}

