/**
 * In-memory hot cache for frequently accessed data
 * Ultra-fast caching for data that's accessed multiple times per second
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  hits: number
}

class HotCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private maxSize = 100 // Maximum number of entries
  private defaultTTL = 5000 // 5 seconds default TTL (very aggressive)
  
  /**
   * Get data from hot cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    // Check if expired
    const age = Date.now() - entry.timestamp
    if (age > this.defaultTTL) {
      this.cache.delete(key)
      return null
    }
    
    // Increment hit counter
    entry.hits++
    
    return entry.data as T
  }
  
  /**
   * Set data in hot cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Evict least recently used if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    })
  }
  
  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }
    
    const age = Date.now() - entry.timestamp
    if (age > this.defaultTTL) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }
  
  /**
   * Delete entry from cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }
  
  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity
    let lowestHits = Infinity
    
    // Find entry with lowest hit count and oldest timestamp
    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < lowestHits || 
          (entry.hits === lowestHits && entry.timestamp < oldestTime)) {
        oldestKey = key
        oldestTime = entry.timestamp
        lowestHits = entry.hits
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.entries())
    const totalHits = entries.reduce((sum, [, entry]) => sum + entry.hits, 0)
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      averageHits: totalHits / this.cache.size || 0,
      entries: entries.map(([key, entry]) => ({
        key,
        hits: entry.hits,
        age: Date.now() - entry.timestamp
      }))
    }
  }
}

// Singleton instance
export const hotCache = new HotCache()

/**
 * Hot cache wrapper for async functions
 * Automatically caches function results with minimal overhead
 */
export function withHotCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = hotCache.get<T>(key)
  if (cached !== null) {
    return Promise.resolve(cached)
  }
  
  // Execute function and cache result
  return fn().then(result => {
    hotCache.set(key, result, ttl)
    return result
  })
}

export default hotCache
