import connectDB from './database'
import { AuditLog } from './models'

export interface AuditLogData {
  userId: string
  userEmail?: string
  userRole?: string
  action: string
  entityType: string
  entityId?: string
  entityName?: string
  changes?: any
  description?: string
  ipAddress?: string
  userAgent?: string
  metadata?: any
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await connectDB()
    await AuditLog.create({
      userId: data.userId,
      userEmail: data.userEmail,
      userRole: data.userRole,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      entityName: data.entityName,
      changes: data.changes,
      description: data.description,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: data.metadata,
    })
  } catch (error: any) {
    // Don't fail the main operation if audit logging fails
    console.error('Error creating audit log:', error)
  }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: {
  userId?: string
  entityType?: string
  entityId?: string
  action?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  skip?: number
}) {
  await connectDB()
  
  const query: any = {}
  
  if (filters.userId) {
    query.userId = filters.userId
  }
  
  if (filters.entityType) {
    query.entityType = filters.entityType
  }
  
  if (filters.entityId) {
    query.entityId = filters.entityId
  }
  
  if (filters.action) {
    query.action = filters.action
  }
  
  if (filters.startDate || filters.endDate) {
    query.createdAt = {}
    if (filters.startDate) {
      query.createdAt.$gte = filters.startDate
    }
    if (filters.endDate) {
      query.createdAt.$lte = filters.endDate
    }
  }
  
  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit || 100)
    .skip(filters.skip || 0)
    .lean()
  
  const total = await AuditLog.countDocuments(query)
  
  return { logs, total }
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLogs(entityType: string, entityId: string, limit: number = 50) {
  await connectDB()
  
  const logs = await AuditLog.find({
    entityType,
    entityId
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
  
  return logs
}

/**
 * Helper to get IP address from request
 */
export function getIpAddress(request: any): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const remoteAddress = request.headers.get('remote-addr')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIp) {
    return realIp
  }
  if (remoteAddress) {
    return remoteAddress
  }
  return 'unknown'
}

/**
 * Helper to get user agent from request
 */
export function getUserAgent(request: any): string {
  return request.headers.get('user-agent') || 'unknown'
}

