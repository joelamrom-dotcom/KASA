import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { getAuthenticatedUser } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

// GET - Server-Sent Events for real-time updates
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      const user = getAuthenticatedUser(request)
      if (!user) {
        controller.close()
        return
      }

      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // Send initial connection message
      sendEvent({ type: 'connected', timestamp: new Date().toISOString() })

      // Simulate real-time updates (in production, use WebSocket or proper SSE with event source)
      const interval = setInterval(() => {
        sendEvent({
          type: 'update',
          data: {
            notifications: 0,
            activities: []
          },
          timestamp: new Date().toISOString()
        })
      }, 30000) // Every 30 seconds

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

