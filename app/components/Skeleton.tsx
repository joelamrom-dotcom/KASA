'use client'

import React from 'react'

interface SkeletonProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'key'> {
  className?: string
  lines?: number
}

export function Skeleton({ className = '', lines = 1, ...props }: SkeletonProps) {
  if (lines > 1) {
    return (
      <div className={className} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"
            style={{ width: i === lines - 1 ? '75%' : '100%' }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
      {...props}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="card">
      <Skeleton className="h-6 w-1/3 mb-4" />
      <Skeleton lines={3} />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {Array.from({ length: 5 }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <Skeleton className="h-4 w-24" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

