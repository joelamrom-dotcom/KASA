import mongoose from 'mongoose'

// Database query optimization utilities

/**
 * Create indexes for frequently queried fields
 */
export async function createIndexes() {
  try {
    const db = mongoose.connection.db
    if (!db) return

    // Family indexes
    await db.collection('families').createIndex({ userId: 1, name: 1 })
    await db.collection('families').createIndex({ userId: 1, email: 1 })
    await db.collection('families').createIndex({ userId: 1, phone: 1 })
    await db.collection('families').createIndex({ userId: 1, createdAt: -1 })
    await db.collection('families').createIndex({ userId: 1, 'paymentPlan.type': 1 })

    // Payment indexes
    await db.collection('payments').createIndex({ userId: 1, familyId: 1, date: -1 })
    await db.collection('payments').createIndex({ userId: 1, date: -1 })
    await db.collection('payments').createIndex({ userId: 1, amount: -1 })
    await db.collection('payments').createIndex({ userId: 1, paymentMethod: 1 })

    // Member indexes
    await db.collection('familymembers').createIndex({ userId: 1, familyId: 1 })
    await db.collection('familymembers').createIndex({ userId: 1, birthDate: 1 })
    await db.collection('familymembers').createIndex({ userId: 1, age: 1 })

    // Lifecycle event indexes
    await db.collection('lifecycleevents').createIndex({ userId: 1, familyId: 1, date: 1 })
    await db.collection('lifecycleevents').createIndex({ userId: 1, date: 1 })
    await db.collection('lifecycleevents').createIndex({ userId: 1, type: 1 })

    // Task indexes
    await db.collection('tasks').createIndex({ userId: 1, dueDate: 1 })
    await db.collection('tasks').createIndex({ userId: 1, status: 1 })
    await db.collection('tasks').createIndex({ userId: 1, assignedTo: 1 })

    console.log('Database indexes created successfully')
  } catch (error) {
    console.error('Error creating indexes:', error)
  }
}

/**
 * Optimize query by selecting only needed fields
 */
export function selectFields(fields: string[]) {
  return fields.reduce((acc, field) => {
    acc[field] = 1
    return acc
  }, {} as Record<string, number>)
}

/**
 * Pagination helper with cursor-based pagination for better performance
 */
export function paginateQuery(
  query: any,
  page: number = 1,
  limit: number = 20,
  sort: Record<string, 1 | -1> = { createdAt: -1 }
) {
  const skip = (page - 1) * limit
  return query.sort(sort).skip(skip).limit(limit)
}

/**
 * Cache frequently accessed data
 */
const cache = new Map<string, { data: any; expires: number }>()

export function getCached<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null
  if (Date.now() > cached.expires) {
    cache.delete(key)
    return null
  }
  return cached.data as T
}

export function setCached(key: string, data: any, ttl: number = 300000) {
  cache.set(key, {
    data,
    expires: Date.now() + ttl,
  })
}

export function clearCache(pattern?: string) {
  if (!pattern) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

/**
 * Batch operations for better performance
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(processor))
    results.push(...batchResults)
  }
  return results
}

