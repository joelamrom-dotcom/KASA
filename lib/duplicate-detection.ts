import connectDB from './database'
import { Family, FamilyMember, Payment, LifecycleEventPayment } from './models'

export interface DuplicateMatch {
  family1: any
  family2: any
  confidence: number // 0-100
  matchReasons: string[]
  differences: {
    field: string
    value1: any
    value2: any
  }[]
}

export interface MergePreview {
  mergedFamily: any
  conflicts: {
    field: string
    value1: any
    value2: any
    resolution?: 'keep1' | 'keep2' | 'merge' | 'custom'
    customValue?: any
  }[]
  membersToMerge: any[]
  paymentsToMerge: any[]
  eventsToMerge: any[]
  stats: {
    totalMembers: number
    totalPayments: number
    totalEvents: number
    totalAmount: number
  }
}

/**
 * Detect duplicate families based on name, email, phone
 */
export async function detectDuplicateFamilies(userId?: string): Promise<DuplicateMatch[]> {
  await connectDB()
  
  const mongoose = require('mongoose')
  const query: any = {}
  if (userId) {
    query.userId = new mongoose.Types.ObjectId(userId)
  }

  const families = await Family.find(query).lean()
  const duplicates: DuplicateMatch[] = []

  for (let i = 0; i < families.length; i++) {
    for (let j = i + 1; j < families.length; j++) {
      const family1 = families[i]
      const family2 = families[j]
      
      const match = compareFamilies(family1, family2)
      if (match.confidence >= 70) { // 70% confidence threshold
        duplicates.push(match)
      }
    }
  }

  return duplicates.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Compare two families and calculate match confidence
 */
function compareFamilies(family1: any, family2: any): DuplicateMatch {
  const matchReasons: string[] = []
  const differences: { field: string; value1: any; value2: any }[] = []
  let confidence = 0

  // Name comparison (fuzzy match)
  if (family1.name && family2.name) {
    const name1 = family1.name.toLowerCase().trim()
    const name2 = family2.name.toLowerCase().trim()
    
    if (name1 === name2) {
      confidence += 40
      matchReasons.push('Exact name match')
    } else if (name1.includes(name2) || name2.includes(name1)) {
      confidence += 30
      matchReasons.push('Partial name match')
    } else {
      differences.push({ field: 'name', value1: family1.name, value2: family2.name })
    }
  }

  // Email comparison
  if (family1.email && family2.email) {
    const email1 = family1.email.toLowerCase().trim()
    const email2 = family2.email.toLowerCase().trim()
    
    if (email1 === email2) {
      confidence += 35
      matchReasons.push('Exact email match')
    } else {
      differences.push({ field: 'email', value1: family1.email, value2: family2.email })
    }
  }

  // Phone comparison (normalize)
  const phone1 = normalizePhone(family1.phone || family1.husbandCellPhone || family1.wifeCellPhone)
  const phone2 = normalizePhone(family2.phone || family2.husbandCellPhone || family2.wifeCellPhone)
  
  if (phone1 && phone2) {
    if (phone1 === phone2) {
      confidence += 25
      matchReasons.push('Exact phone match')
    } else {
      differences.push({ field: 'phone', value1: phone1, value2: phone2 })
    }
  }

  // Wedding date comparison (same date = higher confidence)
  if (family1.weddingDate && family2.weddingDate) {
    const date1 = new Date(family1.weddingDate).toISOString().split('T')[0]
    const date2 = new Date(family2.weddingDate).toISOString().split('T')[0]
    
    if (date1 === date2) {
      confidence += 10
      matchReasons.push('Same wedding date')
    }
  }

  return {
    family1,
    family2,
    confidence: Math.min(confidence, 100),
    matchReasons,
    differences
  }
}

/**
 * Normalize phone number for comparison
 */
function normalizePhone(phone: string | undefined): string | null {
  if (!phone) return null
  return phone.replace(/\D/g, '') // Remove non-digits
}

/**
 * Generate merge preview
 */
export async function generateMergePreview(
  family1Id: string,
  family2Id: string,
  resolutions?: { [field: string]: 'keep1' | 'keep2' | 'merge' | 'custom' | any }
): Promise<MergePreview> {
  await connectDB()

  const family1 = await Family.findById(family1Id).lean()
  const family2 = await Family.findById(family2Id).lean()

  if (!family1 || !family2) {
    throw new Error('One or both families not found')
  }

  // Get related data
  const [members1, members2, payments1, payments2, events1, events2] = await Promise.all([
    FamilyMember.find({ familyId: family1Id }).lean(),
    FamilyMember.find({ familyId: family2Id }).lean(),
    Payment.find({ familyId: family1Id }).lean(),
    Payment.find({ familyId: family2Id }).lean(),
    LifecycleEventPayment.find({ familyId: family1Id }).lean(),
    LifecycleEventPayment.find({ familyId: family2Id }).lean()
  ])

  // Build merged family
  const mergedFamily: any = { ...family1 }
  const conflicts: MergePreview['conflicts'] = []

  // Resolve conflicts
  const fieldsToCheck = ['name', 'hebrewName', 'email', 'phone', 'address', 'city', 'state', 'zip', 
    'husbandFirstName', 'husbandHebrewName', 'wifeFirstName', 'wifeHebrewName', 
    'husbandCellPhone', 'wifeCellPhone', 'weddingDate', 'paymentPlanId', 'currentPlan']

  for (const field of fieldsToCheck) {
    const value1 = family1[field]
    const value2 = family2[field]

    if (value1 && value2 && value1 !== value2) {
      const resolution = resolutions?.[field] || 'keep1'
      
      conflicts.push({
        field,
        value1,
        value2,
        resolution: typeof resolution === 'string' ? resolution : 'custom',
        customValue: typeof resolution !== 'string' ? resolution : undefined
      })

      if (resolution === 'keep2') {
        mergedFamily[field] = value2
      } else if (resolution === 'merge' && field === 'name') {
        mergedFamily[field] = `${value1} / ${value2}`
      } else if (resolution === 'custom' && resolutions?.[field]) {
        mergedFamily[field] = resolutions[field]
      }
    } else if (value2 && !value1) {
      mergedFamily[field] = value2
    }
  }

  // Calculate stats
  const totalPayments = [...payments1, ...payments2]
  const totalAmount = totalPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

  return {
    mergedFamily,
    conflicts,
    membersToMerge: [...members1, ...members2],
    paymentsToMerge: totalPayments,
    eventsToMerge: [...events1, ...events2],
    stats: {
      totalMembers: members1.length + members2.length,
      totalPayments: totalPayments.length,
      totalEvents: events1.length + events2.length,
      totalAmount
    }
  }
}

/**
 * Merge two families
 */
export async function mergeFamilies(
  family1Id: string,
  family2Id: string,
  resolutions: { [field: string]: 'keep1' | 'keep2' | 'merge' | any },
  userId?: string
): Promise<any> {
  await connectDB()

  const preview = await generateMergePreview(family1Id, family2Id, resolutions)
  
  // Update family1 with merged data
  const mergedData: any = { ...preview.mergedFamily }
  delete mergedData._id
  delete mergedData.createdAt
  delete mergedData.updatedAt

  await Family.findByIdAndUpdate(family1Id, mergedData)

  // Move all related data to family1
  await Promise.all([
    FamilyMember.updateMany({ familyId: family2Id }, { $set: { familyId: family1Id } }),
    Payment.updateMany({ familyId: family2Id }, { $set: { familyId: family1Id } }),
    LifecycleEventPayment.updateMany({ familyId: family2Id }, { $set: { familyId: family1Id } })
  ])

  // Delete family2
  await Family.findByIdAndDelete(family2Id)

  return await Family.findById(family1Id).lean()
}

