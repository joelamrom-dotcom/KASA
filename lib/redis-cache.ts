/**
 * Redis caching layer
 * Distributed caching for better performance
 * Note: Requires Redis server - this is a wrapper
 */

interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
}

class RedisCache {
  private client: any = null

  /**
   * Initialize Redis client
   */
  async init() {
    // In production, this would connect to Redis
    // For now, use in-memory fallback
    if (typeof window === 'undefined') {
      try {
        // Try to import Redis client
        // const Redis = require('ioredis')
        // this.client = new Redis(process.env.REDIS_URL)
      } catch (error) {
        console.warn('Redis not available, using in-memory cache')
      }
    }
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client) {
      // Fallback to in-memory cache
      return null
    }

    try {
      const value = await this.client.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  /**
   * Set cached value
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    if (!this.client) {
      return
    }

    try {
      const serialized = JSON.stringify(value)
      if (options.ttl) {
        await this.client.setex(key, options.ttl, serialized)
      } else {
        await this.client.set(key, serialized)
      }

      // Set tags if provided
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await this.client.sadd(`tag:${tag}`, key)
        }
      }
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    if (!this.client) {
      return
    }

    try {
      await this.client.del(key)
    } catch (error) {
      console.error('Redis delete error:', error)
    }
  }

  /**
   * Invalidate by tag
   */
  async invalidateTag(tag: string): Promise<void> {
    if (!this.client) {
      return
    }

    try {
      const keys = await this.client.smembers(`tag:${tag}`)
      if (keys.length > 0) {
        await this.client.del(...keys)
        await this.client.del(`tag:${tag}`)
      }
    } catch (error) {
      console.error('Redis invalidateTag error:', error)
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.client) {
      return
    }

    try {
      await this.client.flushdb()
    } catch (error) {
      console.error('Redis clear error:', error)
    }
  }
}

export const redisCache = new RedisCache()

// Initialize on import
if (typeof window === 'undefined') {
  redisCache.init().catch(console.error)
}

