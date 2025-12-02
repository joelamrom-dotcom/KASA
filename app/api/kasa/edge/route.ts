import { NextRequest, NextResponse } from 'next/server'

// Use edge runtime for faster response times
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * Edge function example
 * Runs at edge locations for minimal latency
 */
export async function GET(request: NextRequest) {
  try {
    // Edge functions have access to request but limited Node.js APIs
    const data = {
      message: 'This is an edge function',
      timestamp: Date.now(),
      region: process.env.VERCEL_REGION || 'unknown',
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

