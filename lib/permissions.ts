/**
 * Permission Management System
 * Provides utilities for checking user permissions and managing roles
 */

import connectDB from './database'
import { Permission, Role, User } from './models'
import { AuthenticatedRequest } from './middleware'

// Permission names (must match database)
export const PERMISSIONS = {
  // Families
  FAMILIES_VIEW: 'families.view',
  FAMILIES_CREATE: 'families.create',
  FAMILIES_UPDATE: 'families.update',
  FAMILIES_DELETE: 'families.delete',
  FAMILIES_EXPORT: 'families.export',
  FAMILIES_IMPORT: 'families.import',
  
  // Members
  MEMBERS_VIEW: 'members.view',
  MEMBERS_CREATE: 'members.create',
  MEMBERS_UPDATE: 'members.update',
  MEMBERS_DELETE: 'members.delete',
  
  // Payments
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_CREATE: 'payments.create',
  PAYMENTS_UPDATE: 'payments.update',
  PAYMENTS_DELETE: 'payments.delete',
  PAYMENTS_EXPORT: 'payments.export',
  PAYMENTS_REFUND: 'payments.refund',
  
  // Lifecycle Events
  LIFECYCLE_EVENTS_VIEW: 'lifecycle_events.view',
  LIFECYCLE_EVENTS_CREATE: 'lifecycle_events.create',
  LIFECYCLE_EVENTS_UPDATE: 'lifecycle_events.update',
  LIFECYCLE_EVENTS_DELETE: 'lifecycle_events.delete',
  
  // Statements
  STATEMENTS_VIEW: 'statements.view',
  STATEMENTS_CREATE: 'statements.create',
  STATEMENTS_DELETE: 'statements.delete',
  STATEMENTS_EXPORT: 'statements.export',
  
  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_CREATE: 'reports.create',
  REPORTS_UPDATE: 'reports.update',
  REPORTS_DELETE: 'reports.delete',
  REPORTS_EXPORT: 'reports.export',
  
  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  
  // Roles
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  
  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',
  
  // Documents
  DOCUMENTS_VIEW: 'documents.view',
  DOCUMENTS_CREATE: 'documents.create',
  DOCUMENTS_UPDATE: 'documents.update',
  DOCUMENTS_DELETE: 'documents.delete',
  
  // Tasks
  TASKS_VIEW: 'tasks.view',
  TASKS_CREATE: 'tasks.create',
  TASKS_UPDATE: 'tasks.update',
  TASKS_DELETE: 'tasks.delete',
  
  // Calendar
  CALENDAR_VIEW: 'calendar.view',
  CALENDAR_MANAGE: 'calendar.manage',
  
  // Communication
  COMMUNICATION_VIEW: 'communication.view',
  COMMUNICATION_SEND: 'communication.send',
  COMMUNICATION_MANAGE: 'communication.manage',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  
  // Payment Plans
  PAYMENT_PLANS_VIEW: 'payment_plans.view',
  PAYMENT_PLANS_CREATE: 'payment_plans.create',
  PAYMENT_PLANS_UPDATE: 'payment_plans.update',
  PAYMENT_PLANS_DELETE: 'payment_plans.delete',
} as const

// Default role permissions mapping
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: Object.values(PERMISSIONS), // All permissions
  admin: [
    PERMISSIONS.FAMILIES_VIEW, PERMISSIONS.FAMILIES_CREATE, PERMISSIONS.FAMILIES_UPDATE, PERMISSIONS.FAMILIES_DELETE, PERMISSIONS.FAMILIES_EXPORT,
    PERMISSIONS.MEMBERS_VIEW, PERMISSIONS.MEMBERS_CREATE, PERMISSIONS.MEMBERS_UPDATE, PERMISSIONS.MEMBERS_DELETE,
    PERMISSIONS.PAYMENTS_VIEW, PERMISSIONS.PAYMENTS_CREATE, PERMISSIONS.PAYMENTS_UPDATE, PERMISSIONS.PAYMENTS_DELETE, PERMISSIONS.PAYMENTS_EXPORT, PERMISSIONS.PAYMENTS_REFUND,
    PERMISSIONS.LIFECYCLE_EVENTS_VIEW, PERMISSIONS.LIFECYCLE_EVENTS_CREATE, PERMISSIONS.LIFECYCLE_EVENTS_UPDATE, PERMISSIONS.LIFECYCLE_EVENTS_DELETE,
    PERMISSIONS.STATEMENTS_VIEW, PERMISSIONS.STATEMENTS_CREATE, PERMISSIONS.STATEMENTS_DELETE, PERMISSIONS.STATEMENTS_EXPORT,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_CREATE, PERMISSIONS.REPORTS_UPDATE, PERMISSIONS.REPORTS_DELETE, PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_DELETE,
    PERMISSIONS.ROLES_VIEW,
    PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.DOCUMENTS_VIEW, PERMISSIONS.DOCUMENTS_CREATE, PERMISSIONS.DOCUMENTS_UPDATE, PERMISSIONS.DOCUMENTS_DELETE,
    PERMISSIONS.TASKS_VIEW, PERMISSIONS.TASKS_CREATE, PERMISSIONS.TASKS_UPDATE, PERMISSIONS.TASKS_DELETE,
    PERMISSIONS.CALENDAR_VIEW, PERMISSIONS.CALENDAR_MANAGE,
    PERMISSIONS.COMMUNICATION_VIEW, PERMISSIONS.COMMUNICATION_SEND, PERMISSIONS.COMMUNICATION_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  user: [
    PERMISSIONS.FAMILIES_VIEW, PERMISSIONS.FAMILIES_CREATE, PERMISSIONS.FAMILIES_UPDATE,
    PERMISSIONS.MEMBERS_VIEW, PERMISSIONS.MEMBERS_CREATE, PERMISSIONS.MEMBERS_UPDATE,
    PERMISSIONS.PAYMENTS_VIEW, PERMISSIONS.PAYMENTS_CREATE, PERMISSIONS.PAYMENTS_UPDATE,
    PERMISSIONS.LIFECYCLE_EVENTS_VIEW, PERMISSIONS.LIFECYCLE_EVENTS_CREATE, PERMISSIONS.LIFECYCLE_EVENTS_UPDATE,
    PERMISSIONS.STATEMENTS_VIEW, PERMISSIONS.STATEMENTS_CREATE,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.DOCUMENTS_VIEW, PERMISSIONS.DOCUMENTS_CREATE, PERMISSIONS.DOCUMENTS_UPDATE,
    PERMISSIONS.TASKS_VIEW, PERMISSIONS.TASKS_CREATE, PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.COMMUNICATION_VIEW, PERMISSIONS.COMMUNICATION_SEND,
  ],
  viewer: [
    PERMISSIONS.FAMILIES_VIEW,
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.LIFECYCLE_EVENTS_VIEW,
    PERMISSIONS.STATEMENTS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.COMMUNICATION_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  family: [
    PERMISSIONS.FAMILIES_VIEW, // Only their own family
    PERMISSIONS.MEMBERS_VIEW, // Only their own members
    PERMISSIONS.PAYMENTS_VIEW, // Only their own payments
    PERMISSIONS.STATEMENTS_VIEW, // Only their own statements
    PERMISSIONS.DOCUMENTS_VIEW, // Only their own documents
  ],
}

/**
 * Get user permissions (combines role permissions and custom role permissions)
 */
export async function getUserPermissions(user: AuthenticatedRequest | null): Promise<string[]> {
  if (!user) return []
  
  await connectDB()
  
  // Super admin has all permissions
  if (user.role === 'super_admin') {
    return Object.values(PERMISSIONS)
  }
  
  // Get user from database
  const dbUser = await User.findById(user.userId).populate('customRoleId')
  if (!dbUser || !dbUser.isActive) return []
  
  // If user has custom role, use its permissions
  if (dbUser.customRoleId && typeof dbUser.customRoleId === 'object' && 'permissions' in dbUser.customRoleId) {
    const customRole = dbUser.customRoleId as any
    const permissionIds = customRole.permissions || []
    const permissions = await Permission.find({ _id: { $in: permissionIds } })
    return permissions.map(p => p.name)
  }
  
  // Otherwise, use default role permissions
  return DEFAULT_ROLE_PERMISSIONS[user.role] || []
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  user: AuthenticatedRequest | null,
  permission: string
): Promise<boolean> {
  if (!user) return false
  
  // Super admin always has all permissions
  if (user.role === 'super_admin') return true
  
  const userPermissions = await getUserPermissions(user)
  return userPermissions.includes(permission)
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  user: AuthenticatedRequest | null,
  permissions: string[]
): Promise<boolean> {
  if (!user) return false
  
  if (user.role === 'super_admin') return true
  
  const userPermissions = await getUserPermissions(user)
  return permissions.some(p => userPermissions.includes(p))
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  user: AuthenticatedRequest | null,
  permissions: string[]
): Promise<boolean> {
  if (!user) return false
  
  if (user.role === 'super_admin') return true
  
  const userPermissions = await getUserPermissions(user)
  return permissions.every(p => userPermissions.includes(p))
}

/**
 * Build a query filter to scope data access by user
 * Only super_admin can see all data; other users see only their own data
 * @param user - The authenticated user
 * @param userIdField - The field name for userId in the query (default: 'userId')
 * @returns Query filter object
 */
export function buildUserScopedQuery(
  user: AuthenticatedRequest | null,
  userIdField: string = 'userId'
): any {
  if (!user) {
    // No user = no access
    return { _id: null } // Return impossible query
  }
  
  // Super admin sees all data
  if (user.role === 'super_admin') {
    return {}
  }
  
  // Family users see only their own family
  if (user.role === 'family' && user.familyId) {
    return { _id: user.familyId }
  }
  
  // All other users (including admins with permissions) see only their own data
  return { [userIdField]: user.userId }
}

/**
 * Check if user can access a specific family
 * @param user - The authenticated user
 * @param familyUserId - The userId of the family owner
 * @returns true if user can access the family
 */
export function canAccessFamily(
  user: AuthenticatedRequest | null,
  familyUserId: string | null | undefined
): boolean {
  if (!user) return false
  
  // Super admin can access all families
  if (user.role === 'super_admin') return true
  
  // Family users can access their own family (checked separately)
  if (user.role === 'family') return true
  
  // Other users can only access families they own
  return familyUserId?.toString() === user.userId
}

/**
 * Get user's family IDs for filtering queries
 * @param user - The authenticated user
 * @returns Array of family IDs the user can access
 */
export async function getUserFamilyIds(user: AuthenticatedRequest | null): Promise<string[]> {
  if (!user) return []
  
  await connectDB()
  const { Family } = await import('@/lib/models')
  
  // Super admin can access all families
  if (user.role === 'super_admin') {
    const allFamilies = await Family.find({}).select('_id').lean()
    return allFamilies.map((f: any) => f._id.toString())
  }
  
  // Family users can access their own family
  if (user.role === 'family' && user.familyId) {
    return [user.familyId]
  }
  
  // Other users can only access families they own
  const userFamilies = await Family.find({ userId: user.userId }).select('_id').lean()
  return userFamilies.map((f: any) => f._id.toString())
}

/**
 * Initialize default permissions in database
 */
export async function initializePermissions(): Promise<void> {
  await connectDB()
  
  for (const [key, value] of Object.entries(PERMISSIONS)) {
    const [module, action] = value.split('.')
    const displayName = key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
    
    await Permission.findOneAndUpdate(
      { name: value },
      {
        name: value,
        displayName,
        module,
        action: action as any,
        description: `Permission to ${action} ${module}`,
      },
      { upsert: true, new: true }
    )
  }
  
  // Initialize default roles
  for (const [roleName, permissionNames] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const permissionDocs = await Permission.find({ name: { $in: permissionNames } })
    const permissionIds = permissionDocs.map(p => p._id)
    
    await Role.findOneAndUpdate(
      { name: roleName },
      {
        name: roleName,
        displayName: roleName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        description: `Default ${roleName} role`,
        isSystem: true,
        permissions: permissionIds,
      },
      { upsert: true, new: true }
    )
  }
}

