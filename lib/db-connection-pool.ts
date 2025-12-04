import mongoose from 'mongoose'

/**
 * Advanced connection pooling configuration
 * Optimizes database connections for maximum performance
 */

let connectionPool: mongoose.Connection | null = null

/**
 * Get optimized connection pool
 */
export async function getConnectionPool() {
  if (connectionPool && connectionPool.readyState === 1) {
    return connectionPool
  }

  const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL
  if (!MONGODB_URI) {
    throw new Error('MongoDB URI not found')
  }

  // Create dedicated connection pool
  connectionPool = await mongoose.createConnection(MONGODB_URI, {
    maxPoolSize: 50, // Increased for high concurrency
    minPoolSize: 10, // Maintain minimum connections
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,
    // Read preference for better performance
    readPreference: 'primaryPreferred',
    // Write concern for better performance
    w: 'majority',
    wtimeoutMS: 5000,
    // Compression
    compressors: ['zlib'],
    zlibCompressionLevel: 6,
  })

  return connectionPool
}

/**
 * Execute query with connection pooling
 */
export async function executeWithPool<T>(
  queryFn: (connection: mongoose.Connection) => Promise<T>
): Promise<T> {
  const connection = await getConnectionPool()
  return queryFn(connection)
}

