import { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/middleware'
import connectDB from '@/lib/database'
import { Family } from '@/lib/models'

export const dynamic = 'force-dynamic'

/**
 * Streaming API endpoint
 * Streams large responses for better perceived performance
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getAuthenticatedUser(request)
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Create a readable stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream initial response
          controller.enqueue(encoder.encode('{"data":['))

          // Stream families in batches
          const batchSize = 50
          const query = { userId: user.userId }
          let skip = 0
          let hasMore = true

          while (hasMore) {
            const batch = await Family.find(query)
              .skip(skip)
              .limit(batchSize)
              .lean()

            if (batch.length === 0) {
              hasMore = false
            } else {
              // Stream batch
              const batchJson = JSON.stringify(batch)
              controller.enqueue(encoder.encode(batchJson))
              
              if (batch.length < batchSize) {
                hasMore = false
              } else {
                skip += batchSize
                controller.enqueue(encoder.encode(','))
              }
            }
          }

          // Close stream
          controller.enqueue(encoder.encode(']}'))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

