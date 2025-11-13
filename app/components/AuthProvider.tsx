'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
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
    const checkAuth = () => {
      const publicRoute = publicRoutes.some(route => pathname?.startsWith(route))
      setIsPublicRoute(publicRoute)
      
      // If it's a public route, allow access
      if (publicRoute) {
        setIsChecking(false)
        return
      }

      // Check if user is authenticated
      if (!isAuthenticated()) {
        // Redirect to login with return URL
        const loginUrl = `/login?redirect=${encodeURIComponent(pathname || '/')}`
        router.push(loginUrl)
        return
      }

      setIsChecking(false)
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

