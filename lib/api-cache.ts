/**
 * API Response Caching Layer
 * Provides in-memory caching for API responses with TTL
 */

interface CacheEntry<T> {
  data: T
  expires: number
  timestamp: number
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>()
  private maxSize = 1000 // Maximum cache entries

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cache data
   */
  set<T>(key: string, data: T, ttl: number = 300000): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
      timestamp: Date.now(),
    })
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
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

  /**
   * Get cache stats
   */
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const entry of this.cache.values()) {
      if (now > entry.expires) {
        expiredEntries++
      } else {
        validEntries++
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
    }
  }
}

export const apiCache = new APICache()

/**
 * Generate cache key from request
 */
export function generateCacheKey(
  path: string,
  params?: Record<string, any>
): string {
  const sortedParams = params
    ? Object.keys(params)
        .sort()
        .map((key) => `${key}=${JSON.stringify(params[key])}`)
        .join('&')
    : ''
  return `${path}${sortedParams ? `?${sortedParams}` : ''}`
}

