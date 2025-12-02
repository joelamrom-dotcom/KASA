import mongoose from 'mongoose'

/**
 * Optimize MongoDB queries for better performance
 */

interface QueryOptions {
  select?: string[]
  populate?: string[]
  lean?: boolean
  limit?: number
  skip?: number
  sort?: Record<string, 1 | -1>
  cache?: boolean
  cacheTTL?: number
}

/**
 * Execute optimized query with caching
 */
export async function optimizedQuery<T>(
  model: mongoose.Model<any>,
  filter: any,
  options: QueryOptions = {}
): Promise<T[]> {
  const {
    select,
    populate,
    lean = true, // Use lean for better performance
    limit = 100,
    skip = 0,
    sort = { createdAt: -1 },
    cache = false,
    cacheTTL = 300000, // 5 minutes
  } = options

  // Build query
  let query = model.find(filter)

  // Select only needed fields
  if (select && select.length > 0) {
    query = query.select(select.join(' '))
  }

  // Populate relations
  if (populate && populate.length > 0) {
    populate.forEach(path => {
      query = query.populate(path)
    })
  }

  // Apply pagination
  if (skip > 0) {
    query = query.skip(skip)
  }
  if (limit > 0) {
    query = query.limit(limit)
  }

  // Apply sorting
  query = query.sort(sort)

  // Use lean for better performance (returns plain objects)
  if (lean) {
    query = query.lean()
  }

  // Execute query
  const results = await query.exec()

  return results as T[]
}

/**
 * Aggregate query with optimization
 */
export async function optimizedAggregate<T>(
  model: mongoose.Model<any>,
  pipeline: any[]
): Promise<T[]> {
  const results = await model.aggregate(pipeline).exec()
  return results as T[]
}

/**
 * Count query optimization
 */
export async function optimizedCount(
  model: mongoose.Model<any>,
  filter: any
): Promise<number> {
  return await model.countDocuments(filter).exec()
}

/**
 * Find one with optimization
 */
export async function optimizedFindOne<T>(
  model: mongoose.Model<any>,
  filter: any,
  options: Omit<QueryOptions, 'limit' | 'skip'> = {}
): Promise<T | null> {
  const {
    select,
    populate,
    lean = true,
  } = options

  let query = model.findOne(filter)

  if (select && select.length > 0) {
    query = query.select(select.join(' '))
  }

  if (populate && populate.length > 0) {
    populate.forEach(path => {
      query = query.populate(path)
    })
  }

  if (lean) {
    query = query.lean()
  }

  const result = await query.exec()
  return result as T | null
}

