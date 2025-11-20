/**
 * Database Query Optimization Utilities
 * Provides optimized query helpers and aggregation pipelines
 */

import { FilterGroup } from '@/app/components/FilterBuilder'

/**
 * Build optimized MongoDB query from filter groups
 */
export function buildOptimizedQuery(
  filterGroups: FilterGroup[],
  baseQuery: any = {}
): any {
  if (!filterGroups || filterGroups.length === 0) {
    return baseQuery
  }

  // Convert filter groups to MongoDB $or/$and queries
  const orConditions: any[] = []

  for (const group of filterGroups) {
    if (group.conditions.length === 0) continue

    const groupConditions: any[] = []

    for (const condition of group.conditions) {
      const fieldQuery = buildFieldQuery(condition)
      if (fieldQuery) {
        groupConditions.push(fieldQuery)
      }
    }

    if (groupConditions.length > 0) {
      if (group.logic === 'AND') {
        orConditions.push({ $and: groupConditions })
      } else {
        orConditions.push({ $or: groupConditions })
      }
    }
  }

  if (orConditions.length === 0) {
    return baseQuery
  }

  if (orConditions.length === 1) {
    return { ...baseQuery, ...orConditions[0] }
  }

  return { ...baseQuery, $or: orConditions }
}

function buildFieldQuery(condition: any): any {
  const { field, operator, value, value2 } = condition

  switch (operator) {
    case 'equals':
      return { [field]: value }
    case 'contains':
      return { [field]: { $regex: value, $options: 'i' } }
    case 'startsWith':
      return { [field]: { $regex: `^${value}`, $options: 'i' } }
    case 'endsWith':
      return { [field]: { $regex: `${value}$`, $options: 'i' } }
    case 'greaterThan':
      return { [field]: { $gt: value } }
    case 'lessThan':
      return { [field]: { $lt: value } }
    case 'between':
      return { [field]: { $gte: Math.min(value, value2), $lte: Math.max(value, value2) } }
    case 'in':
      return { [field]: { $in: Array.isArray(value) ? value : [value] } }
    case 'notIn':
      return { [field]: { $nin: Array.isArray(value) ? value : [value] } }
    case 'isEmpty':
      return { $or: [{ [field]: null }, { [field]: '' }, { [field]: { $exists: false } }] }
    case 'isNotEmpty':
      return { 
        $and: [
          { [field]: { $ne: null } },
          { [field]: { $ne: '' } },
          { [field]: { $exists: true } }
        ]
      }
    default:
      return null
  }
}

/**
 * Optimized aggregation pipeline for families with payments
 */
export function getFamiliesWithPaymentsPipeline(userId: string, filters?: any) {
  return [
    { $match: { userId: userId, ...filters } },
    {
      $lookup: {
        from: 'payments',
        localField: '_id',
        foreignField: 'familyId',
        as: 'payments',
      },
    },
    {
      $addFields: {
        totalPayments: { $sum: '$payments.amount' },
        paymentCount: { $size: '$payments' },
        memberCount: { $size: { $ifNull: ['$members', []] } },
      },
    },
    {
      $project: {
        payments: 0, // Don't include full payment array
      },
    },
  ]
}

/**
 * Optimized pagination helper
 */
export function getPaginationParams(page: number, limit: number = 10) {
  const skip = (page - 1) * limit
  return { skip, limit }
}

/**
 * Optimized sort helper
 */
export function getSortParams(sortColumn?: string | null, sortDirection: 'asc' | 'desc' = 'asc') {
  if (!sortColumn) return {}
  
  const sortOrder = sortDirection === 'asc' ? 1 : -1
  return { [sortColumn]: sortOrder }
}

/**
 * Optimized search query builder
 */
export function buildSearchQuery(searchTerm: string, searchFields: string[]) {
  if (!searchTerm || searchTerm.trim() === '') {
    return {}
  }

  const regex = { $regex: searchTerm.trim(), $options: 'i' }
  const conditions = searchFields.map(field => ({ [field]: regex }))

  return { $or: conditions }
}

/**
 * Optimized count query (uses countDocuments for better performance)
 */
export async function getOptimizedCount(
  model: any,
  query: any = {}
): Promise<number> {
  return model.countDocuments(query).lean()
}

/**
 * Optimized find with projection (only fetch needed fields)
 */
export async function getOptimizedFind(
  model: any,
  query: any = {},
  projection: any = {},
  options: any = {}
) {
  return model.find(query, projection, options).lean()
}

