import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { Family, Payment, FamilyMember, LifecycleEvent } from '@/lib/models'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// POST - Import data from JSON/CSV
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { data, dataType, validateOnly } = body

    if (!data) {
      return NextResponse.json({ error: 'Data is required' }, { status: 400 })
    }

    const mongoose = require('mongoose')
    const userObjectId = new mongoose.Types.ObjectId(user.userId)

    const errors: string[] = []
    const warnings: string[] = []
    const results: any = {
      families: { created: 0, updated: 0, errors: 0 },
      payments: { created: 0, errors: 0 },
      members: { created: 0, errors: 0 },
      events: { created: 0, errors: 0 }
    }

    // Validate and import families
    if (data.families && Array.isArray(data.families)) {
      for (const familyData of data.families) {
        try {
          // Validation
          if (!familyData.name) {
            errors.push(`Family missing name: ${JSON.stringify(familyData)}`)
            results.families.errors++
            continue
          }

          if (!validateOnly) {
            // Check if family exists
            const existing = await Family.findOne({
              userId: userObjectId,
              name: familyData.name,
              email: familyData.email
            })

            if (existing) {
              // Update existing
              await Family.findByIdAndUpdate(existing._id, {
                ...familyData,
                userId: userObjectId,
                _id: undefined
              })
              results.families.updated++
            } else {
              // Create new
              await Family.create({
                ...familyData,
                userId: userObjectId,
                _id: undefined
              })
              results.families.created++
            }
          }
        } catch (error: any) {
          errors.push(`Error importing family ${familyData.name}: ${error.message}`)
          results.families.errors++
        }
      }
    }

    // Validate and import payments
    if (data.payments && Array.isArray(data.payments)) {
      for (const paymentData of data.payments) {
        try {
          if (!paymentData.familyId || !paymentData.amount) {
            errors.push(`Payment missing required fields: ${JSON.stringify(paymentData)}`)
            results.payments.errors++
            continue
          }

          if (!validateOnly) {
            // Find family by name or ID
            let family
            if (typeof paymentData.familyId === 'string') {
              family = await Family.findOne({
                userId: userObjectId,
                $or: [
                  { _id: paymentData.familyId },
                  { name: paymentData.familyId }
                ]
              })
            }

            if (!family) {
              warnings.push(`Family not found for payment: ${paymentData.familyId}`)
              results.payments.errors++
              continue
            }

            await Payment.create({
              ...paymentData,
              familyId: family._id,
              _id: undefined
            })
            results.payments.created++
          }
        } catch (error: any) {
          errors.push(`Error importing payment: ${error.message}`)
          results.payments.errors++
        }
      }
    }

    // Similar logic for members and events...

    return NextResponse.json({
      success: !validateOnly,
      validateOnly,
      results,
      errors: errors.slice(0, 100), // Limit errors
      warnings: warnings.slice(0, 100)
    })
  } catch (error: any) {
    console.error('Error importing data:', error)
    return NextResponse.json(
      { error: 'Failed to import data', details: error.message },
      { status: 500 }
    )
  }
}

