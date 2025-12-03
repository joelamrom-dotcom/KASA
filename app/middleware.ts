import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Enhanced caching headers for API routes
function getCacheHeaders(pathname: string) {
  // Static data that changes infrequently
  if (pathname.includes('/api/kasa/families') || pathname.includes('/api/kasa/members')) {
    return {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    }
  }
  
  // Frequently changing data
  if (pathname.includes('/api/kasa/payments') || pathname.includes('/api/kasa/dashboard')) {
    return {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
    }
  }
  
  // Real-time data
  if (pathname.includes('/api/kasa/notifications') || pathname.includes('/api/kasa/realtime')) {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  }
  
  return {
    'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60',
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Add performance headers
  const response = NextResponse.next()
  
  // Add cache headers for API routes
  if (pathname.startsWith('/api/')) {
    const cacheHeaders = getCacheHeaders(pathname)
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }

  // Add compression hint
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Add performance timing headers
  response.headers.set('X-Response-Time', Date.now().toString())

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
