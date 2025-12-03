'use client'

import dynamic from 'next/dynamic'

/**
 * Route-based code splitting
 * More granular code splitting per route
 */

// Split by route
export const FamiliesPage = dynamic(() => import('@/app/families/page'), {
  loading: () => <div>Loading families...</div>,
})

export const PaymentsPage = dynamic(() => import('@/app/payments/page'), {
  loading: () => <div>Loading payments...</div>,
})

/**
 * Lazy load route components
 */
export function lazyLoadRoute(route: string) {
  return dynamic(() => import(`@/app/${route}/page`), {
    loading: () => <div>Loading...</div>,
  })
}

