import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * On-demand revalidation endpoint
 * Allows manual cache invalidation for ISR pages
 * 
 * Usage:
 * POST /api/revalidate
 * Body: { path: '/dashboard' } or { tag: 'dashboard-stats' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, tag, secret } = body
    
    // Verify secret token (optional, for security)
    if (secret && secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { message: 'Invalid secret' },
        { status: 401 }
      )
    }
    
    if (path) {
      // Revalidate by path
      revalidatePath(path)
      return NextResponse.json({
        revalidated: true,
        path,
        timestamp: Date.now()
      })
    }
    
    if (tag) {
      // Revalidate by tag
      revalidateTag(tag)
      return NextResponse.json({
        revalidated: true,
        tag,
        timestamp: Date.now()
      })
    }
    
    return NextResponse.json(
      { message: 'Missing path or tag parameter' },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { message: 'Error revalidating', error: String(error) },
      { status: 500 }
    )
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Revalidation API endpoint',
    usage: {
      method: 'POST',
      body: {
        path: '/dashboard',
        // or
        tag: 'stats',
        // optional
        secret: 'your-secret-token'
      }
    }
  })
}
