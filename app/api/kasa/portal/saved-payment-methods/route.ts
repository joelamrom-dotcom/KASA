import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { SavedPaymentMethod, Family } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Get saved payment methods for current family (family portal)
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

    // Only family role users can access this
    if (user.role !== 'family') {
      return NextResponse.json(
        { error: 'Access denied. This endpoint is for family users only.' },
        { status: 403 }
      )
    }

    // Find family by familyId from user
    if (!user.familyId) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const familyResult = await Family.findById(user.familyId).lean()
    if (!familyResult) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const family = familyResult as any
    const familyId = String(family._id)
    
    const paymentMethods = await SavedPaymentMethod.find({
      familyId,
      isActive: true
    }).sort({ isDefault: -1, createdAt: -1 }).lean()

    return NextResponse.json({
      paymentMethods: paymentMethods.map((pm: any) => ({
        _id: pm._id.toString(),
        last4: pm.last4,
        cardType: pm.cardType,
        expiryMonth: pm.expiryMonth,
        expiryYear: pm.expiryYear,
        nameOnCard: pm.nameOnCard,
        isDefault: pm.isDefault
      })),
      count: paymentMethods.length
    })
  } catch (error: any) {
    console.error('Error fetching saved payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved payment methods', details: error.message },
      { status: 500 }
    )
  }
}

