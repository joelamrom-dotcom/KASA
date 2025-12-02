'use client'

import { Suspense, ReactNode } from 'react'

/**
 * Streaming provider for Suspense boundaries
 * Enables React 18 streaming SSR
 */
export default function StreamingProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded" />}>
      {children}
    </Suspense>
  )
}

