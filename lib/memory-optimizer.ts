/**
 * Memory optimization utilities
 * Reduces memory footprint for better performance
 */

/**
 * Clean up unused objects to free memory
 */
export function cleanupMemory() {
  if (typeof window !== 'undefined' && 'gc' in window) {
    // Force garbage collection if available (Chrome DevTools)
    ;(window as any).gc()
  }
}

/**
 * Monitor memory usage
 */
export function getMemoryUsage() {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    }
  }
  return null
}

/**
 * Optimize large arrays by chunking
 */
export function chunkArray<T>(array: T[], chunkSize: number = 1000): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Debounce memory cleanup
 */
let cleanupTimer: NodeJS.Timeout | null = null

export function scheduleMemoryCleanup() {
  if (cleanupTimer) {
    clearTimeout(cleanupTimer)
  }
  
  cleanupTimer = setTimeout(() => {
    cleanupMemory()
  }, 30000) // Clean up every 30 seconds
}

