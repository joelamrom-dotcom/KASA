import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'
import { Family, FamilyMember, Payment } from '@/lib/models'
import { validateEmail, validatePhone } from '@/lib/data-validation'

export const dynamic = 'force-dynamic'

// GET - Get data quality metrics
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mongoose = require('mongoose')
    const userId = new mongoose.Types.ObjectId(user.userId)

    // Get all families
    const families = await Family.find({ userId }).lean()
    const members = await FamilyMember.find({ 
      familyId: { $in: families.map((f: any) => f._id) } 
    }).lean()
    const payments = await Payment.find({ 
      familyId: { $in: families.map((f: any) => f._id) } 
    }).lean()

    // Calculate quality metrics
    let invalidEmails = 0
    let invalidPhones = 0
    let missingEmails = 0
    let missingPhones = 0
    let missingNames = 0
    let missingWeddingDates = 0
    let missingBirthDates = 0

    for (const family of families) {
      if (!family.email) {
        missingEmails++
      } else if (!validateEmail(family.email)) {
        invalidEmails++
      }

      if (!family.phone && !family.husbandCellPhone && !family.wifeCellPhone) {
        missingPhones++
      } else {
        const hasValidPhone = validatePhone(family.phone) || 
                             validatePhone(family.husbandCellPhone) || 
                             validatePhone(family.wifeCellPhone)
        if (!hasValidPhone) {
          invalidPhones++
        }
      }

      if (!family.name || !family.name.trim()) {
        missingNames++
      }

      if (!family.weddingDate) {
        missingWeddingDates++
      }
    }

    for (const member of members) {
      if (!member.birthDate) {
        missingBirthDates++
      }
    }

    const totalFamilies = families.length
    const totalMembers = members.length
    const totalPayments = payments.length

    const qualityScore = calculateQualityScore({
      totalFamilies,
      invalidEmails,
      invalidPhones,
      missingEmails,
      missingPhones,
      missingNames,
      missingWeddingDates,
      missingBirthDates,
      totalMembers
    })

    return NextResponse.json({
      qualityScore,
      metrics: {
        totalFamilies,
        totalMembers,
        totalPayments,
        invalidEmails,
        invalidPhones,
        missingEmails,
        missingPhones,
        missingNames,
        missingWeddingDates,
        missingBirthDates
      },
      issues: [
        ...(invalidEmails > 0 ? [{ type: 'invalid_email', count: invalidEmails, severity: 'high' }] : []),
        ...(invalidPhones > 0 ? [{ type: 'invalid_phone', count: invalidPhones, severity: 'medium' }] : []),
        ...(missingEmails > 0 ? [{ type: 'missing_email', count: missingEmails, severity: 'medium' }] : []),
        ...(missingPhones > 0 ? [{ type: 'missing_phone', count: missingPhones, severity: 'low' }] : []),
        ...(missingNames > 0 ? [{ type: 'missing_name', count: missingNames, severity: 'high' }] : []),
        ...(missingWeddingDates > 0 ? [{ type: 'missing_wedding_date', count: missingWeddingDates, severity: 'high' }] : []),
        ...(missingBirthDates > 0 ? [{ type: 'missing_birth_date', count: missingBirthDates, severity: 'medium' }] : [])
      ]
    })
  } catch (error: any) {
    console.error('Error calculating data quality:', error)
    return NextResponse.json(
      { error: 'Failed to calculate data quality', details: error.message },
      { status: 500 }
    )
  }
}

function calculateQualityScore(metrics: any): number {
  const {
    totalFamilies,
    invalidEmails,
    invalidPhones,
    missingEmails,
    missingPhones,
    missingNames,
    missingWeddingDates,
    missingBirthDates,
    totalMembers
  } = metrics

  let score = 100

  // Deduct points for issues
  score -= (invalidEmails / totalFamilies) * 20 // High severity
  score -= (missingNames / totalFamilies) * 30 // High severity
  score -= (missingWeddingDates / totalFamilies) * 25 // High severity
  score -= (invalidPhones / totalFamilies) * 10 // Medium severity
  score -= (missingEmails / totalFamilies) * 10 // Medium severity
  score -= (missingPhones / totalFamilies) * 5 // Low severity
  score -= (missingBirthDates / totalMembers) * 5 // Medium severity

  return Math.max(0, Math.min(100, Math.round(score)))
}

