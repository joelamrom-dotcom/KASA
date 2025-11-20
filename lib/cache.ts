/**
 * In-Memory Cache with TTL (Time To Live)
 * Provides fast data access for frequently queried data
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class Cache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private maxSize: number = 1000 // Maximum number of entries

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if entry has expired
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete a specific key
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
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTimestamp = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
}

// Singleton instance
const cache = new Cache()

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup()
  }, 5 * 60 * 1000)
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  families: (userId?: string) => `families:${userId || 'all'}`,
  family: (id: string) => `family:${id}`,
  payments: (userId?: string, filters?: string) => `payments:${userId || 'all'}:${filters || 'none'}`,
  paymentPlans: (userId?: string) => `paymentPlans:${userId || 'all'}`,
  members: (familyId: string) => `members:${familyId}`,
  dashboardStats: (userId?: string) => `dashboardStats:${userId || 'all'}`,
}

/**
 * Cache helper functions
 */
export function getCachedData<T>(key: string): T | null {
  return cache.get<T>(key)
}

export function setCachedData<T>(key: string, data: T, ttl?: number): void {
  cache.set(key, data, ttl)
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    cache.clear()
    return
  }

  // Delete keys matching pattern
  const stats = cache.getStats()
  for (const key of stats.keys) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

export function getCacheStats() {
  return cache.getStats()
}

export default cache

