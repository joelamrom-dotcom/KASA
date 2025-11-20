import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, Payment, RecurringPayment, Statement } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

// GET - Get current family's data (for family portal)
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

    // Find family by email or phone
    const family = await Family.findOne({
      $or: [
        { email: user.email },
        { husbandCellPhone: user.email },
        { wifeCellPhone: user.email },
        { phone: user.email }
      ]
    }).lean()

    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    // Get recent payments (last 10)
    // Type assertion: findOne().lean() returns a single document or null, not an array
    const familyDoc = family as { _id: mongoose.Types.ObjectId | string }
    const familyId = String(familyDoc._id)
    const recentPayments = await Payment.find({ familyId })
      .sort({ paymentDate: -1 })
      .limit(10)
      .lean()

    // Get upcoming recurring payments
    const upcomingRecurringPayments = await RecurringPayment.find({
      familyId,
      isActive: true,
      nextPaymentDate: { $gte: new Date() }
    })
      .sort({ nextPaymentDate: 1 })
      .limit(5)
      .lean()

    // Get recent statements (last 5)
    const recentStatements = await Statement.find({ familyId })
      .sort({ date: -1 })
      .limit(5)
      .lean()

    // Calculate total paid this year
    const currentYear = new Date().getFullYear()
    const paymentsThisYear = await Payment.aggregate([
      { $match: { familyId, year: currentYear } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
    const totalPaidThisYear = paymentsThisYear.length > 0 ? paymentsThisYear[0].total : 0

    return NextResponse.json({
      family: {
        _id: familyId,
        name: family.name,
        hebrewName: family.hebrewName,
        email: family.email,
        phone: family.phone,
        address: family.address,
        city: family.city,
        state: family.state,
        zip: family.zip,
        husbandFirstName: family.husbandFirstName,
        wifeFirstName: family.wifeFirstName,
        husbandCellPhone: family.husbandCellPhone,
        wifeCellPhone: family.wifeCellPhone
      },
      recentPayments,
      upcomingRecurringPayments,
      recentStatements,
      totalPaidThisYear,
      stats: {
        totalPayments: recentPayments.length,
        upcomingPayments: upcomingRecurringPayments.length,
        recentStatements: recentStatements.length
      }
    })
  } catch (error: any) {
    console.error('Error fetching family data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch family data', details: error.message },
      { status: 500 }
    )
  }
}

