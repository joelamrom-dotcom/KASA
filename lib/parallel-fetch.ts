/**
 * Parallel data fetching utilities
 * Fetch multiple resources simultaneously for better performance
 */

/**
 * Fetch multiple resources in parallel
 */
export async function fetchParallel<T>(
  fetchers: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(fetchers.map(fn => fn()))
}

/**
 * Fetch with timeout
 */
export async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeout: number = 5000
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return await response.json()
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

/**
 * Batch fetch with concurrency limit
 */
export async function fetchBatch<T>(
  urls: string[],
  options: RequestInit = {},
  concurrency: number = 5
): Promise<T[]> {
  const results: T[] = []
  
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(url => fetch(url, options).then(res => res.json()))
    )
    results.push(...batchResults)
  }
  
  return results
}

