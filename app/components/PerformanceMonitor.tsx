'use client'

import { useState, useEffect } from 'react'
import { performanceMonitor } from '@/lib/performance'
import { XMarkIcon, ChartBarIcon } from '@heroicons/react/24/outline'

/**
 * Performance Monitor Component
 * Displays real-time performance metrics
 */
export default function PerformanceMonitor() {
  const [isOpen, setIsOpen] = useState(false)
  const [summary, setSummary] = useState<Record<string, any>>({})
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (!isOpen || !enabled) return

    const interval = setInterval(() => {
      setSummary(performanceMonitor.getSummary())
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, enabled])

  if (!enabled && !isOpen) return null

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Performance Monitor"
      >
        <ChartBarIcon className="h-5 w-5" />
      </button>

      {/* Monitor Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-[600px] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Performance Monitor
            </h3>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => {
                    setEnabled(e.target.checked)
                    performanceMonitor.setEnabled(e.target.checked)
                  }}
                  className="rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">Enabled</span>
              </label>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {Object.keys(summary).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No performance data yet. Start using the app to see metrics.
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(summary).map(([name, stats]) => (
                  <div
                    key={name}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                  >
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">
                      {name}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Count:</span>{' '}
                        <span className="font-medium">{stats.count}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Avg:</span>{' '}
                        <span className="font-medium">{stats.avgDuration.toFixed(2)}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Min:</span>{' '}
                        <span className="font-medium">{stats.minDuration.toFixed(2)}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Max:</span>{' '}
                        <span className="font-medium">{stats.maxDuration.toFixed(2)}ms</span>
                      </div>
                    </div>
                    {stats.avgDuration > 1000 && (
                      <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                        ⚠️ Slow operation detected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <button
              onClick={() => {
                performanceMonitor.clear()
                setSummary({})
              }}
              className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Clear
            </button>
            <button
              onClick={() => {
                const data = performanceMonitor.export()
                const blob = new Blob([data], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `performance-${Date.now()}.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Export
            </button>
          </div>
        </div>
      )}
    </>
  )
}

