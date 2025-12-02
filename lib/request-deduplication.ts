/**
 * Request deduplication
 * Prevents duplicate API calls for the same resource
 */

interface PendingRequest {
  promise: Promise<any>
  timestamp: number
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest>()
  private readonly DEDUP_WINDOW = 1000 // 1 second window

  /**
   * Deduplicate request - if same request is made within window, return existing promise
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const now = Date.now()
    const existing = this.pendingRequests.get(key)

    // If request exists and is recent, return existing promise
    if (existing && now - existing.timestamp < this.DEDUP_WINDOW) {
      return existing.promise
    }

    // Create new request
    const promise = requestFn()
    this.pendingRequests.set(key, { promise, timestamp: now })

    // Clean up after request completes
    promise
      .then(() => {
        setTimeout(() => {
          this.pendingRequests.delete(key)
        }, this.DEDUP_WINDOW)
      })
      .catch(() => {
        this.pendingRequests.delete(key)
      })

    return promise
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pendingRequests.clear()
  }
}

export const requestDeduplicator = new RequestDeduplicator()

/**
 * Deduplicate fetch request
 */
export async function deduplicateFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const key = `${url}:${JSON.stringify(options)}`
  return requestDeduplicator.deduplicate(key, async () => {
    const response = await fetch(url, options)
    return response.json()
  })
}

