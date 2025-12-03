/**
 * Database Batch Operations
 * Optimize multiple database operations into batches
 */

import mongoose from 'mongoose'

interface BatchOperation<T> {
  model: mongoose.Model<any>
  operation: 'find' | 'findOne' | 'count' | 'aggregate'
  filter?: any
  options?: any
  pipeline?: any[]
}

/**
 * Execute multiple database operations in a single batch
 */
export async function executeBatch<T>(
  operations: BatchOperation<T>[]
): Promise<any[]> {
  // Group operations by model for better batching
  const grouped = operations.reduce((acc, op) => {
    const modelName = op.model.modelName
    if (!acc[modelName]) {
      acc[modelName] = []
    }
    acc[modelName].push(op)
    return acc
  }, {} as Record<string, BatchOperation<T>[]>)

  // Execute each group in parallel
  const groupPromises = Object.entries(grouped).map(async ([modelName, ops]) => {
    return Promise.all(
      ops.map(async (op) => {
        switch (op.operation) {
          case 'find':
            return op.model.find(op.filter || {}, null, op.options || {}).lean().exec()
          case 'findOne':
            return op.model.findOne(op.filter || {}, null, op.options || {}).lean().exec()
          case 'count':
            return op.model.countDocuments(op.filter || {}).exec()
          case 'aggregate':
            return op.model.aggregate(op.pipeline || []).exec()
          default:
            throw new Error(`Unknown operation: ${op.operation}`)
        }
      })
    )
  })

  const results = await Promise.all(groupPromises)
  
  // Flatten results
  return results.flat()
}

/**
 * Batch insert with optimized performance
 */
export async function batchInsert<T>(
  model: mongoose.Model<any>,
  documents: T[],
  batchSize: number = 1000
): Promise<void> {
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize)
    await model.insertMany(batch, { ordered: false })
  }
}

/**
 * Batch update with optimized performance
 */
export async function batchUpdate(
  model: mongoose.Model<any>,
  updates: Array<{ filter: any; update: any }>,
  batchSize: number = 100
): Promise<void> {
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize)
    await Promise.all(
      batch.map(({ filter, update }) =>
        model.updateMany(filter, update).exec()
      )
    )
  }
}

/**
 * Optimized bulk operations
 */
export async function bulkOperations(
  model: mongoose.Model<any>,
  operations: Array<{
    operation: 'insert' | 'update' | 'delete'
    filter?: any
    document?: any
    update?: any
  }>
): Promise<void> {
  const bulkOps = model.collection.initializeUnorderedBulkOp()

  operations.forEach((op) => {
    switch (op.operation) {
      case 'insert':
        if (op.document) {
          bulkOps.insert(op.document)
        }
        break
      case 'update':
        if (op.filter && op.update) {
          bulkOps.find(op.filter).update(op.update)
        }
        break
      case 'delete':
        if (op.filter) {
          bulkOps.find(op.filter).delete()
        }
        break
    }
  })

  await bulkOps.execute()
}

