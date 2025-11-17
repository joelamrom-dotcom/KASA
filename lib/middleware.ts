import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface AuthenticatedRequest {
  userId: string
  email: string
  role: 'super_admin' | 'admin' | 'user' | 'viewer' | 'family'
  familyId?: string // For family users
}

/**
 * Extract user from JWT token in request
 */
export function getAuthenticatedUser(request: NextRequest): AuthenticatedRequest | null {
  try {
    // Try to get token from cookie first
    let token = request.cookies.get('token')?.value
    
    // If not in cookie, try Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }
    
    if (!token) {
      return null
    }
    
    // Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      familyId: decoded.familyId
    }
  } catch (error) {
    console.error('Error authenticating user:', error)
    return null
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth(request: NextRequest): AuthenticatedRequest {
  const user = getAuthenticatedUser(request)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

/**
 * Check if user is admin (includes super_admin)
 */
export function isAdmin(user: AuthenticatedRequest | null): boolean {
  return user?.role === 'admin' || user?.role === 'super_admin'
}

/**
 * Check if user is a family user
 */
export function isFamilyUser(user: AuthenticatedRequest | null): boolean {
  return user?.role === 'family'
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: AuthenticatedRequest | null): boolean {
  return user?.role === 'super_admin'
}

