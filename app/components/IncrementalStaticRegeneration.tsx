'use client'

/**
 * Incremental Static Regeneration (ISR) configuration
 * Regenerates static pages in the background
 */

export const ISRConfig = {
  // Revalidate pages every 60 seconds
  revalidate: 60,
  // Fallback to stale content while revalidating
  fallback: 'stale-while-revalidate' as const,
}

/**
 * Get ISR configuration for a page
 */
export function getISRConfig(revalidateSeconds: number = 60) {
  return {
    revalidate: revalidateSeconds,
    fallback: 'stale-while-revalidate' as const,
  }
}

