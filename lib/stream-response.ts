/**
 * Stream large JSON responses to improve time-to-first-byte
 * 
 * Usage in API routes:
 * 
 * ```ts
 * export async function GET(req: Request) {
 *   const families = await Family.find().lean()
 *   return streamJsonResponse(families)
 * }
 * ```
 */

export function streamJsonResponse<T>(data: T[], chunkSize = 50) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send opening bracket
        controller.enqueue(encoder.encode('['))
        
        // Stream data in chunks
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize)
          const isLastChunk = i + chunkSize >= data.length
          
          // Serialize chunk
          const chunkJson = chunk.map((item, idx) => {
            const json = JSON.stringify(item)
            const isLast = isLastChunk && idx === chunk.length - 1
            return json + (isLast ? '' : ',')
          }).join(',')
          
          controller.enqueue(encoder.encode(chunkJson))
          
          // Add comma if not last chunk
          if (!isLastChunk) {
            controller.enqueue(encoder.encode(','))
          }
          
          // Small delay to prevent blocking
          await new Promise(resolve => setTimeout(resolve, 0))
        }
        
        // Send closing bracket
        controller.enqueue(encoder.encode(']'))
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
    },
  })
}

/**
 * Stream large JSON object responses
 * 
 * Usage:
 * ```ts
 * const stats = {
 *   families: largeFamilyArray,
 *   payments: largePaymentArray,
 *   analytics: analyticsData
 * }
 * return streamJsonObjectResponse(stats)
 * ```
 */
export function streamJsonObjectResponse<T extends Record<string, any>>(
  data: T,
  chunkKeys?: string[]
) {
  const encoder = new TextEncoder()
  const keys = chunkKeys || Object.keys(data)
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode('{'))
        
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i]
          const value = data[key]
          const isLast = i === keys.length - 1
          
          // Send key
          controller.enqueue(encoder.encode(`"${key}":`))
          
          // Send value (stream if array)
          if (Array.isArray(value)) {
            controller.enqueue(encoder.encode('['))
            
            for (let j = 0; j < value.length; j++) {
              const item = value[j]
              const isLastItem = j === value.length - 1
              controller.enqueue(
                encoder.encode(JSON.stringify(item) + (isLastItem ? '' : ','))
              )
              
              // Yield control every 50 items
              if (j % 50 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0))
              }
            }
            
            controller.enqueue(encoder.encode(']'))
          } else {
            controller.enqueue(encoder.encode(JSON.stringify(value)))
          }
          
          if (!isLast) {
            controller.enqueue(encoder.encode(','))
          }
          
          await new Promise(resolve => setTimeout(resolve, 0))
        }
        
        controller.enqueue(encoder.encode('}'))
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
    },
  })
}

/**
 * Client-side utility to consume streamed JSON responses
 * 
 * Usage:
 * ```ts
 * const families = await fetchStreamedJson<Family[]>('/api/kasa/families')
 * ```
 */
export async function fetchStreamedJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.body) {
    throw new Error('Response body is null')
  }
  
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  
  while (true) {
    const { done, value } = await reader.read()
    
    if (done) {
      break
    }
    
    buffer += decoder.decode(value, { stream: true })
  }
  
  return JSON.parse(buffer) as T
}

/**
 * Progressive JSON parser - parses and yields items as they arrive
 * 
 * Usage:
 * ```ts
 * for await (const family of streamJsonArray<Family>('/api/kasa/families')) {
 *   // Process family as it arrives
 *   console.log(family)
 * }
 * ```
 */
export async function* streamJsonArray<T>(url: string): AsyncGenerator<T> {
  const response = await fetch(url)
  if (!response.body) {
    throw new Error('Response body is null')
  }
  
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let inString = false
  let depth = 0
  let itemStart = -1
  
  while (true) {
    const { done, value } = await reader.read()
    
    if (done) {
      break
    }
    
    buffer += decoder.decode(value, { stream: true })
    
    // Simple JSON array parser
    for (let i = 0; i < buffer.length; i++) {
      const char = buffer[i]
      
      if (char === '"' && buffer[i - 1] !== '\\') {
        inString = !inString
      }
      
      if (!inString) {
        if (char === '{') {
          if (depth === 0) {
            itemStart = i
          }
          depth++
        } else if (char === '}') {
          depth--
          if (depth === 0 && itemStart !== -1) {
            // Complete item found
            const itemJson = buffer.slice(itemStart, i + 1)
            try {
              const item = JSON.parse(itemJson) as T
              yield item
            } catch (e) {
              console.error('Failed to parse item:', itemJson, e)
            }
            itemStart = -1
          }
        }
      }
    }
    
    // Keep unprocessed data in buffer
    if (itemStart !== -1) {
      buffer = buffer.slice(itemStart)
    } else {
      buffer = ''
    }
  }
}
