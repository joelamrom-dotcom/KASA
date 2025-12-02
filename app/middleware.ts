import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')

  // Cache static assets aggressively
  if (
    request.nextUrl.pathname.startsWith('/_next/static') ||
    request.nextUrl.pathname.startsWith('/static')
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    )
  }

  // Cache API responses (shorter TTL)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Don't cache authenticated endpoints
    if (!request.headers.get('authorization')) {
      response.headers.set(
        'Cache-Control',
        'public, s-maxage=60, stale-while-revalidate=300'
      )
    }
  }

  // Enable compression
  response.headers.set('Accept-Encoding', 'gzip, br')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

