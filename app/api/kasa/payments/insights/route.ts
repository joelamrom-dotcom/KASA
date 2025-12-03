import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import { analyzePaymentPattern, identifyAtRiskFamilies, getPaymentSuggestions } from '@/lib/payment-pattern-analysis'

// GET - Get payment insights for a family or all families
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const familyId = searchParams.get('familyId')

    if (familyId) {
      // Get insights for a specific family
      try {
        const pattern = await analyzePaymentPattern(familyId)
        const familyResult = await Family.findById(familyId).lean()
        
        if (!familyResult) {
          return NextResponse.json({ error: 'Family not found' }, { status: 404 })
        }

        const family = familyResult as any

        // Check if user has access to this family
        if (family.userId?.toString() !== user.userId) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        // Get payment suggestions
        const recurringPaymentResult = await (await import('@/lib/models')).RecurringPayment.findOne({
          familyId,
          isActive: true
        }).lean()

        let suggestions = null
        if (recurringPaymentResult) {
          const recurringPayment = recurringPaymentResult as any
          suggestions = await getPaymentSuggestions(
            familyId,
            family.openBalance || 0,
            new Date(recurringPayment.nextPaymentDate)
          )
        }

        return NextResponse.json({
          success: true,
          familyId,
          familyName: family.name,
          pattern,
          suggestions,
          currentBalance: family.openBalance || 0
        })
      } catch (error: any) {
        console.error('Error getting family payment insights:', error)
        return NextResponse.json(
          { error: 'Failed to get payment insights', details: error.message },
          { status: 500 }
        )
      }
    } else {
      // Get at-risk families for this user
      try {
        const atRiskFamilies = await identifyAtRiskFamilies(user.userId)
        
        return NextResponse.json({
          success: true,
          atRiskFamilies,
          total: atRiskFamilies.length,
          byRiskLevel: {
            high: atRiskFamilies.filter(f => f.riskLevel === 'high').length,
            medium: atRiskFamilies.filter(f => f.riskLevel === 'medium').length,
            low: atRiskFamilies.filter(f => f.riskLevel === 'low').length
          }
        })
      } catch (error: any) {
        console.error('Error getting at-risk families:', error)
        return NextResponse.json(
          { error: 'Failed to get at-risk families', details: error.message },
          { status: 500 }
        )
      }
    }
  } catch (error: any) {
    console.error('Error in payment insights API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

