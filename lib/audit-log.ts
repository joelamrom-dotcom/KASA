/**
 * Audit Logging System
 * Tracks all user actions and changes in the system
 */

import connectDB from './database'
import { AuditLog } from './models'
import { AuthenticatedRequest } from './middleware'
import { NextRequest } from 'next/server'

export interface AuditLogData {
  userId: string
  userEmail?: string
  userRole?: string
  action: string
  entityType: string
  entityId?: string
  entityName?: string
  changes?: Record<string, { old?: any; new?: any }>
  description?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
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
  } catch (error) {
    console.error('Error creating audit log:', error)
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Extract IP address and user agent from request
 */
export function getRequestInfo(request: NextRequest): { ipAddress?: string; userAgent?: string } {
  const ipAddress = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    undefined
  
  const userAgent = request.headers.get('user-agent') || undefined
  
  return { ipAddress, userAgent }
}

/**
 * Create audit log from request and user
 */
export async function auditLogFromRequest(
  request: NextRequest,
  user: AuthenticatedRequest | null,
  action: string,
  entityType: string,
  options: {
    entityId?: string
    entityName?: string
    changes?: Record<string, { old?: any; new?: any }>
    description?: string
    metadata?: Record<string, any>
  } = {}
): Promise<void> {
  if (!user) return
  
  const { ipAddress, userAgent } = getRequestInfo(request)
  
  await createAuditLog({
    userId: user.userId,
    userEmail: user.email,
    userRole: user.role,
    action,
    entityType,
    entityId: options.entityId,
    entityName: options.entityName,
    changes: options.changes,
    description: options.description,
    ipAddress,
    userAgent,
    metadata: options.metadata,
  })
}

/**
 * Get audit logs with filtering
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
  
  if (filters.userId) query.userId = filters.userId
  if (filters.entityType) query.entityType = filters.entityType
  if (filters.entityId) query.entityId = filters.entityId
  if (filters.action) query.action = filters.action
  if (filters.startDate || filters.endDate) {
    query.createdAt = {}
    if (filters.startDate) query.createdAt.$gte = filters.startDate
    if (filters.endDate) query.createdAt.$lte = filters.endDate
  }
  
  return AuditLog.find(query)
    .populate('userId', 'email firstName lastName')
    .sort({ createdAt: -1 })
    .limit(filters.limit || 100)
    .skip(filters.skip || 0)
    .lean()
}
