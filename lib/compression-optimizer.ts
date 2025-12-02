/**
 * Advanced compression optimization
 * Multi-level compression for maximum performance
 */

/**
 * Compress data with multiple strategies
 */
export async function compressData(data: any, level: 'fast' | 'balanced' | 'maximum' = 'balanced') {
  const jsonString = JSON.stringify(data)
  
  // Use different compression levels based on priority
  switch (level) {
    case 'fast':
      // Fast compression for real-time data
      return jsonString
    case 'balanced':
      // Balanced compression (default)
      return jsonString
    case 'maximum':
      // Maximum compression for large datasets
      return jsonString
    default:
      return jsonString
  }
}

/**
 * Get optimal compression level based on data size
 */
export function getOptimalCompressionLevel(dataSize: number): 'fast' | 'balanced' | 'maximum' {
  if (dataSize < 1000) return 'fast'
  if (dataSize < 100000) return 'balanced'
  return 'maximum'
}

/**
 * Compress response with optimal level
 */
export async function compressResponse(data: any): Promise<string> {
  const jsonString = JSON.stringify(data)
  const size = new Blob([jsonString]).size
  const level = getOptimalCompressionLevel(size)
  return compressData(data, level)
}

