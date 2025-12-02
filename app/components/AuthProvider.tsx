'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isAuthenticated, getUser, setAuth } from '@/lib/auth'

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth/google/success', // Google OAuth callback success page
]

interface AuthContextType {
  isPublicRoute: boolean
}

const AuthContext = createContext<AuthContextType>({ isPublicRoute: false })

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [isPublicRoute, setIsPublicRoute] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      // Get pathname without query parameters for route matching
      const pathWithoutQuery = pathname?.split('?')[0] || pathname
      const publicRoute = publicRoutes.some(route => pathWithoutQuery?.startsWith(route))
      setIsPublicRoute(publicRoute)
      
      // If it's a public route, allow access immediately
      if (publicRoute) {
        setIsChecking(false)
        return
      }

      // Small delay to allow localStorage to be set (especially for OAuth redirects)
      setTimeout(async () => {
        // Check if user is authenticated
        if (!isAuthenticated()) {
          // Only redirect if not already on login page to prevent loops
          if (pathWithoutQuery !== '/login') {
            const loginUrl = `/login?redirect=${encodeURIComponent(pathname || '/')}`
            router.push(loginUrl)
          } else {
            // Already on login page, just stop checking
            setIsChecking(false)
          }
          return
        }

        // Note: DB fallback in API routes handles access for joelamrom@gmail.com
        // No need to refresh session - API routes check DB directly

        setIsChecking(false)
      }, 50)
    }

    checkAuth()
  }, [pathname, router])

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isPublicRoute }}>
      {children}
    </AuthContext.Provider>
  )
}

