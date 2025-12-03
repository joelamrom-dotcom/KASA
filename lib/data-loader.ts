/**
 * Ultra-Fast Data Loading System
 * Combines multiple optimization strategies for fastest possible data loading
 */

import { apiCache, generateCacheKey } from './api-cache'
import { optimizedQuery } from './query-optimizer'
import { cachedQuery } from './query-result-cache'

interface DataLoaderOptions {
  cache?: boolean
  cacheTTL?: number
  parallel?: boolean
  prefetch?: boolean
  stream?: boolean
  dedupe?: boolean
  select?: string[]
  lean?: boolean
}

// Request deduplication map
const pendingRequests = new Map<string, Promise<any>>()

/**
 * Ultra-optimized data loader with multiple strategies
 */
export async function loadData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: DataLoaderOptions = {}
): Promise<T> {
  const {
    cache = true,
    cacheTTL = 300000, // 5 minutes
    dedupe = true,
    select,
    lean = true,
  } = options

  const cacheKey = generateCacheKey(key)

  // 1. Check cache first (fastest path)
  if (cache) {
    const cached = apiCache.get<T>(cacheKey)
    if (cached !== null) {
      return cached
    }
  }

  // 2. Deduplicate concurrent requests
  if (dedupe && pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!
  }

  // 3. Execute fetch
  const fetchPromise = fetchFn().then((data) => {
    // Cache the result
    if (cache) {
      apiCache.set(cacheKey, data, cacheTTL)
    }
    // Remove from pending
    pendingRequests.delete(cacheKey)
    return data
  }).catch((error) => {
    pendingRequests.delete(cacheKey)
    throw error
  })

  if (dedupe) {
    pendingRequests.set(cacheKey, fetchPromise)
  }

  return fetchPromise
}

/**
 * Load multiple data sources in parallel
 */
export async function loadDataParallel<T extends Record<string, any>>(
  loaders: Record<keyof T, () => Promise<T[keyof T]>>,
  options: DataLoaderOptions = {}
): Promise<T> {
  const keys = Object.keys(loaders) as Array<keyof T>
  const promises = keys.map((key) =>
    loadData(key as string, loaders[key], options)
  )

  const results = await Promise.all(promises)

  return keys.reduce((acc, key, index) => {
    acc[key] = results[index]
    return acc
  }, {} as T)
}

/**
 * Prefetch data for faster subsequent loads
 */
export function prefetchData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: DataLoaderOptions = {}
): void {
  // Use requestIdleCallback if available, otherwise setTimeout
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      loadData(key, fetchFn, { ...options, cache: true })
    })
  } else {
    setTimeout(() => {
      loadData(key, fetchFn, { ...options, cache: true })
    }, 100)
  }
}

/**
 * Load data with streaming support
 */
export async function* loadDataStream<T>(
  key: string,
  fetchFn: () => Promise<T[]>,
  options: DataLoaderOptions = {}
): AsyncGenerator<T, void, unknown> {
  const data = await loadData(key, fetchFn, options)
  
  if (Array.isArray(data)) {
    for (const item of data) {
      yield item
    }
  }
}

/**
 * Batch multiple queries into a single database call
 */
export async function batchLoad<T>(
  queries: Array<{
    model: any
    filter: any
    options?: any
  }>
): Promise<T[][]> {
  // Execute all queries in parallel
  const promises = queries.map(({ model, filter, options }) =>
    optimizedQuery(model, filter, options)
  )

  return Promise.all(promises)
}

/**
 * Smart prefetch based on user behavior
 */
export class SmartPrefetcher {
  private prefetchQueue: Array<{ key: string; fetchFn: () => Promise<any> }> = []
  private isProcessing = false

  add(key: string, fetchFn: () => Promise<any>) {
    this.prefetchQueue.push({ key, fetchFn })
    this.process()
  }

  private async process() {
    if (this.isProcessing || this.prefetchQueue.length === 0) return

    this.isProcessing = true

    while (this.prefetchQueue.length > 0) {
      const { key, fetchFn } = this.prefetchQueue.shift()!
      
      // Use idle time for prefetching
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        await new Promise<void>((resolve) => {
          requestIdleCallback(() => {
            loadData(key, fetchFn, { cache: true }).catch(console.error)
            resolve()
          })
        })
      } else {
        // Fallback: small delay
        await new Promise((resolve) => setTimeout(resolve, 50))
        loadData(key, fetchFn, { cache: true }).catch(console.error)
      }
    }

    this.isProcessing = false
  }
}

export const smartPrefetcher = new SmartPrefetcher()

/**
 * Load critical data immediately, non-critical in background
 */
export async function loadDataPrioritized<T>(
  critical: () => Promise<T>,
  background: Array<() => Promise<any>> = []
): Promise<T> {
  // Load critical data immediately
  const criticalData = await critical()

  // Load background data when idle
  if (background.length > 0 && typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        Promise.all(background.map((fn) => fn().catch(console.error)))
      })
    } else {
      setTimeout(() => {
        Promise.all(background.map((fn) => fn().catch(console.error)))
      }, 100)
    }
  }

  return criticalData
}

