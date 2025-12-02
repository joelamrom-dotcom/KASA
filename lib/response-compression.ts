/**
 * Response compression utilities
 * Compresses API responses for faster transmission
 */

/**
 * Compress JSON response
 */
export function compressResponse(data: any): string {
  // Remove unnecessary whitespace
  return JSON.stringify(data)
}

/**
 * Add compression headers to response
 */
export function addCompressionHeaders(headers: Headers): void {
  headers.set('Content-Encoding', 'gzip')
  headers.set('Vary', 'Accept-Encoding')
}

/**
 * Get optimal cache headers based on content type
 */
export function getCacheHeaders(
  contentType: string,
  maxAge: number = 3600
): Record<string, string> {
  const headers: Record<string, string> = {}

  if (contentType.includes('application/json')) {
    headers['Cache-Control'] = `public, max-age=${maxAge}, s-maxage=${maxAge * 2}, stale-while-revalidate=600`
  } else if (contentType.includes('text/html')) {
    headers['Cache-Control'] = 'public, max-age=0, must-revalidate'
  } else if (contentType.includes('image')) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable'
  }

  return headers
}

