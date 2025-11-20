/**
 * Performance Monitoring Utilities
 * Track and log performance metrics
 */

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics: number = 1000
  private enabled: boolean = true

  /**
   * Start a performance timer
   */
  start(name: string): (metadata?: Record<string, any>) => void {
    const startTime = performance.now()
    
    return (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime
      this.record(name, duration, metadata)
    }
  }

  /**
   * Record a performance metric
   */
  record(name: string, duration: number, metadata?: Record<string, any>): void {
    if (!this.enabled) return

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    }

    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log slow operations (> 1 second)
    if (duration > 1000) {
      console.warn(`[Performance] Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metadata)
    }
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (!name) {
      return [...this.metrics]
    }
    return this.metrics.filter(m => m.name === name)
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(name: string): number {
    const operationMetrics = this.getMetrics(name)
    if (operationMetrics.length === 0) return 0

    const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0)
    return total / operationMetrics.length
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, {
    count: number
    avgDuration: number
    minDuration: number
    maxDuration: number
  }> {
    const summary: Record<string, {
      count: number
      avgDuration: number
      minDuration: number
      maxDuration: number
      durations: number[]
    }> = {}

    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          avgDuration: 0,
          minDuration: Infinity,
          maxDuration: 0,
          durations: [],
        }
      }

      const stat = summary[metric.name]
      stat.count++
      stat.durations.push(metric.duration)
      stat.minDuration = Math.min(stat.minDuration, metric.duration)
      stat.maxDuration = Math.max(stat.maxDuration, metric.duration)
    }

    // Calculate averages
    for (const name in summary) {
      const stat = summary[name] as any
      stat.avgDuration = stat.durations.reduce((a: number, b: number) => a + b, 0) / stat.durations.length
      delete stat.durations
    }

    return summary
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify({
      metrics: this.metrics,
      summary: this.getSummary(),
    }, null, 2)
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * React Hook for performance monitoring
 */
export function usePerformanceMonitor() {
  return {
    start: performanceMonitor.start.bind(performanceMonitor),
    record: performanceMonitor.record.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getSummary: performanceMonitor.getSummary.bind(performanceMonitor),
    clear: performanceMonitor.clear.bind(performanceMonitor),
  }
}

/**
 * Higher-order function to measure async function performance
 */
export function measurePerformance<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  return (async (...args: any[]) => {
    const end = performanceMonitor.start(name)
    try {
      const result = await fn(...args)
      end()
      return result
    } catch (error) {
      end({ error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }) as T
}

/**
 * Measure synchronous function performance
 */
export function measureSyncPerformance<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: any[]) => {
    const end = performanceMonitor.start(name)
    try {
      const result = fn(...args)
      end()
      return result
    } catch (error) {
      end({ error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }) as T
}

