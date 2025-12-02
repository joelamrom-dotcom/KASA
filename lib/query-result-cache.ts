/**
 * Database query result caching
 * Caches query results at database level
 */

import mongoose from 'mongoose'

interface QueryCacheEntry {
  query: string
  result: any
  timestamp: number
  ttl: number
}

class QueryResultCache {
  private cache = new Map<string, QueryCacheEntry>()

  /**
   * Get cached query result
   */
  get(queryKey: string): any | null {
    const entry = this.cache.get(queryKey)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(queryKey)
      return null
    }

    return entry.result
  }

  /**
   * Set query result in cache
   */
  set(queryKey: string, result: any, ttl: number = 300000): void {
    this.cache.set(queryKey, {
      query: queryKey,
      result,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Generate cache key from query
   */
  generateKey(model: string, filter: any, options: any = {}): string {
    return `${model}:${JSON.stringify(filter)}:${JSON.stringify(options)}`
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear cache by pattern
   */
  clearPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

export const queryResultCache = new QueryResultCache()

/**
 * Cached query wrapper
 */
export async function cachedQuery<T>(
  model: mongoose.Model<any>,
  filter: any,
  options: any = {},
  ttl: number = 300000
): Promise<T[]> {
  const cacheKey = queryResultCache.generateKey(
    model.modelName,
    filter,
    options
  )

  // Check cache
  const cached = queryResultCache.get(cacheKey)
  if (cached) {
    return cached as T[]
  }

  // Execute query
  let query = model.find(filter)

  if (options.select) {
    query = query.select(options.select)
  }

  if (options.sort) {
    query = query.sort(options.sort)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  if (options.skip) {
    query = query.skip(options.skip)
  }

  if (options.lean) {
    query = query.lean()
  }

  const result = await query.exec()

  // Cache result
  queryResultCache.set(cacheKey, result, ttl)

  return result as T[]
}

