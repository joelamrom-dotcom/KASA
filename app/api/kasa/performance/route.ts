import { NextRequest, NextResponse } from 'next/server'
import { apiCache, generateCacheKey } from '@/lib/api-cache'
import { getCacheHeaders } from '@/lib/response-compression'

export const dynamic = 'force-dynamic'

// GET - Get performance metrics
export async function GET(request: NextRequest) {
  try {
    const cacheKey = generateCacheKey('/api/kasa/performance')
    const cached = apiCache.get(cacheKey)
    
    if (cached) {
      return NextResponse.json(cached, {
        headers: getCacheHeaders('application/json', 60),
      })
    }

    const stats = {
      cache: apiCache.getStats(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: Date.now(),
    }

    apiCache.set(cacheKey, stats, 60000) // Cache for 1 minute

    return NextResponse.json(stats, {
      headers: getCacheHeaders('application/json', 60),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get performance metrics', details: error.message },
      { status: 500 }
    )
  }
}

