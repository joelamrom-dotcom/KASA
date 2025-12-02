/**
 * Performance monitoring utilities
 * Track and optimize performance metrics
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []

  /**
   * Measure function execution time
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.recordMetric(name, duration)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric(`${name}_error`, duration)
      throw error
    }
  }

  /**
   * Record performance metric
   */
  recordMetric(name: string, value: number) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
    })

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift()
    }

    // Log slow operations
    if (value > 1000) {
      console.warn(`Slow operation detected: ${name} took ${value.toFixed(2)}ms`)
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return this.metrics
  }

  /**
   * Get average time for operation
   */
  getAverageTime(name: string): number {
    const relevantMetrics = this.metrics.filter(m => m.name === name)
    if (relevantMetrics.length === 0) return 0
    
    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0)
    return sum / relevantMetrics.length
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics = []
  }
}

export const performanceMonitor = new PerformanceMonitor()

/**
 * Performance mark/measure utilities
 */
export function mark(name: string) {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name)
  }
}

export function measure(name: string, startMark: string, endMark: string) {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name)[0]
      return measure.duration
    } catch (error) {
      console.error('Performance measure error:', error)
      return 0
    }
  }
  return 0
}

