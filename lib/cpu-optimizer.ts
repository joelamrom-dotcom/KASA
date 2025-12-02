/**
 * CPU optimization utilities
 * Reduces main thread work for better responsiveness
 */

/**
 * Use requestIdleCallback for non-critical work
 */
export function scheduleIdleWork(callback: () => void, timeout: number = 5000) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout })
  } else {
    // Fallback to setTimeout
    setTimeout(callback, 0)
  }
}

/**
 * Batch DOM updates to reduce reflows
 */
export function batchDOMUpdates(updates: (() => void)[]) {
  // Use requestAnimationFrame to batch updates
  requestAnimationFrame(() => {
    updates.forEach(update => update())
  })
}

/**
 * Use Web Workers for CPU-intensive tasks
 */
export function offloadToWorker<T, R>(
  workerScript: string,
  data: T,
  onResult: (result: R) => void
) {
  const blob = new Blob([workerScript], { type: 'application/javascript' })
  const url = URL.createObjectURL(blob)
  const worker = new Worker(url)

  worker.postMessage(data)
  worker.onmessage = (e) => {
    onResult(e.data)
    worker.terminate()
    URL.revokeObjectURL(url)
  }

  worker.onerror = (error) => {
    console.error('Worker error:', error)
    worker.terminate()
    URL.revokeObjectURL(url)
  }
}

/**
 * Throttle expensive operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

