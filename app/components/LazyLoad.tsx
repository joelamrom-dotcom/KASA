'use client'

import { Suspense, lazy, ComponentType } from 'react'
import { TableSkeleton } from './LoadingSkeleton'

interface LazyLoadProps {
  // Component to lazy load
  loader: () => Promise<{ default: ComponentType<any> }>
  // Props to pass to the lazy loaded component
  componentProps?: any
  // Custom loading fallback
  fallback?: React.ReactNode
  // Custom error boundary
  errorFallback?: React.ReactNode
}

/**
 * LazyLoad wrapper for code splitting with Suspense
 * 
 * Usage:
 * <LazyLoad 
 *   loader={() => import('./MyComponent')}
 *   componentProps={{ foo: 'bar' }}
 * />
 */
export function LazyLoad({ 
  loader, 
  componentProps = {}, 
  fallback,
  errorFallback 
}: LazyLoadProps) {
  const LazyComponent = lazy(loader)
  
  const defaultFallback = (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
        </div>
        <TableSkeleton rows={10} />
      </div>
    </div>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <LazyComponent {...componentProps} />
    </Suspense>
  )
}

/**
 * Helper hook to create lazy-loaded page components
 * 
 * Usage:
 * const LazyFamiliesPage = createLazyPage(() => import('./families/page'))
 */
export function createLazyPage(loader: () => Promise<{ default: ComponentType<any> }>) {
  return (props: any) => <LazyLoad loader={loader} componentProps={props} />
}

export default LazyLoad
