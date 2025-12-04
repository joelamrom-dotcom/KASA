/**
 * Request Deduplication
 * Prevents multiple identical requests from hitting the database simultaneously
 * by caching in-flight requests and returning the same promise
 */

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
}

class RequestDeduplicator {
  private pending: Map<string, PendingRequest<any>> = new Map()
  private readonly timeout = 30000 // 30 seconds

  /**
   * Deduplicate a request - if same request is already in flight, return that promise
   */
  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    const existing = this.pending.get(key)
    if (existing) {
      // Check if not timed out
      if (Date.now() - existing.timestamp < this.timeout) {
        return existing.promise as Promise<T>
      }
      // Remove timed out request
      this.pending.delete(key)
    }

    // Create new request
    const promise = fn()
      .finally(() => {
        // Remove from pending after completion
        this.pending.delete(key)
      })

    // Store as pending
    this.pending.set(key, {
      promise,
      timestamp: Date.now()
    })

    return promise
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pending.clear()
  }

  /**
   * Get pending request count
   */
  getPendingCount() {
    return this.pending.size
  }
}

// Singleton instance
const deduplicator = new RequestDeduplicator()

/**
 * Helper function to deduplicate database queries
 */
export async function dedupeQuery<T>(
  key: string,
  queryFn: () => Promise<T>
): Promise<T> {
  return deduplicator.dedupe(key, queryFn)
}

/**
 * Generate a unique key for a query
 */
export function generateQueryKey(
  collection: string,
  operation: string,
  params: Record<string, any>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key]
      return acc
    }, {} as Record<string, any>)
  
  return `${collection}:${operation}:${JSON.stringify(sortedParams)}`
}

export default deduplicator
