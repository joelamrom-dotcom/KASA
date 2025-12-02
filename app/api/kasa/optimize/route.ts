import { NextRequest, NextResponse } from 'next/server'
import { requestDeduplicator } from '@/lib/request-deduplication'
import { compressResponse } from '@/lib/compression-optimizer'
import { getEdgeCacheHeaders } from '@/app/components/EdgeCache'

export const dynamic = 'force-dynamic'

/**
 * Optimized API endpoint with all performance features
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const cacheKey = url.pathname + url.search

    // Use request deduplication
    const data = await requestDeduplicator.deduplicate(cacheKey, async () => {
      // Simulate API call
      return { message: 'Optimized response', timestamp: Date.now() }
    })

    // Compress response
    const compressed = await compressResponse(data)

    // Get cache headers
    const cacheHeaders = getEdgeCacheHeaders('application/json')

    return new NextResponse(compressed, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
        ...cacheHeaders,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

