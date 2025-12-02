import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'

export const dynamic = 'force-dynamic'

// GET - Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Check database connection
    await connectDB()
    const dbTime = Date.now() - startTime

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'connected',
          responseTime: `${dbTime}ms`
        }
      },
      uptime: process.uptime()
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      { status: 503 }
    )
  }
}

