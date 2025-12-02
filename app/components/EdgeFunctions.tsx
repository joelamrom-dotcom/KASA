/**
 * Edge Functions configuration
 * Move API logic to edge for faster response times
 */

export const edgeConfig = {
  // Runtime for edge functions
  runtime: 'edge' as const,
  // Regions for edge deployment
  regions: ['iad1', 'sfo1', 'lhr1'], // US East, US West, Europe
}

/**
 * Edge function helper
 */
export async function edgeFunction<T>(
  handler: (request: Request) => Promise<T>
): Promise<T> {
  // This would be used in API routes with edge runtime
  return handler as any
}

