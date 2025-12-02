'use client'

/**
 * Efficient cache policies
 * Optimizes cache headers for maximum performance
 */

export const cachePolicies = {
  // Static assets - cache forever
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
  // API responses - short cache with revalidation
  api: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300, max-age=0',
  },
  // HTML pages - medium cache with revalidation
  html: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  },
  // Images - long cache
  images: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
  // Fonts - very long cache
  fonts: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
}

/**
 * Get optimal cache policy for content type
 */
export function getCachePolicy(contentType: string): Record<string, string> {
  if (contentType.includes('image')) {
    return cachePolicies.images
  }
  if (contentType.includes('font')) {
    return cachePolicies.fonts
  }
  if (contentType.includes('text/html')) {
    return cachePolicies.html
  }
  if (contentType.includes('application/json')) {
    return cachePolicies.api
  }
  return cachePolicies.static
}

