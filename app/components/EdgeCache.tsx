'use client'

/**
 * Edge caching configuration
 * Optimizes caching at CDN/edge level
 */

export const edgeCacheConfig = {
  // Cache static assets for 1 year
  staticAssets: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
  // Cache API responses with stale-while-revalidate
  apiResponses: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  },
  // Cache HTML pages
  htmlPages: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  },
}

/**
 * Get cache headers for different content types
 */
export function getEdgeCacheHeaders(contentType: string): Record<string, string> {
  if (contentType.includes('image') || contentType.includes('font')) {
    return edgeCacheConfig.staticAssets
  }
  if (contentType.includes('application/json')) {
    return edgeCacheConfig.apiResponses
  }
  if (contentType.includes('text/html')) {
    return edgeCacheConfig.htmlPages
  }
  return {}
}

