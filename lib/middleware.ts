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
 * For API routes, prioritizes Authorization header over cookies to ensure fresh tokens are used
 */
export function getAuthenticatedUser(request: NextRequest): AuthenticatedRequest | null {
  try {
    let token: string | undefined
    
    // For API routes, check Authorization header FIRST (client explicitly sends this)
    // This ensures we use the fresh token from localStorage, not stale cookies
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
    
    if (isApiRoute) {
      // API routes: Authorization header takes priority
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
      
      // Fallback to cookie if no Authorization header
      if (!token) {
        token = request.cookies.get('token')?.value
      }
    } else {
      // Non-API routes: Cookie first (for SSR/SSG)
      token = request.cookies.get('token')?.value
      
      // Fallback to Authorization header
      if (!token) {
        const authHeader = request.headers.get('authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7)
        }
      }
    }
    
    if (!token) {
      return null
    }
    
    // Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Log token info for debugging (only for /api/users to avoid spam)
    if (isApiRoute && request.nextUrl.pathname === '/api/users') {
      const cookieToken = request.cookies.get('token')?.value
      const headerToken = request.headers.get('authorization')?.substring(7)
      const tokenSource = token === headerToken ? 'Authorization header' : token === cookieToken ? 'Cookie' : 'Unknown'
      console.log('getAuthenticatedUser - Token email:', decoded.email, 'Role:', decoded.role, 'Source:', tokenSource)
    }
    
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

