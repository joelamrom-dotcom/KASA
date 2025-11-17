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
      const publicRoute = publicRoutes.some(route => pathname?.startsWith(route))
      setIsPublicRoute(publicRoute)
      
      // If it's a public route, allow access
      if (publicRoute) {
        setIsChecking(false)
        return
      }

      // Small delay to allow localStorage to be set (especially for OAuth redirects)
      setTimeout(async () => {
        // Check if user is authenticated
        if (!isAuthenticated()) {
          // Redirect to login with return URL
          const loginUrl = `/login?redirect=${encodeURIComponent(pathname || '/')}`
          router.push(loginUrl)
          return
        }

        // Force refresh session for joelamrom@gmail.com to ensure role is up to date
        const user = getUser()
        if (user && user.email === 'joelamrom@gmail.com') {
          try {
            const res = await fetch('/api/auth/refresh-user', { method: 'POST' })
            if (res.ok) {
              const data = await res.json()
              console.log('AuthProvider: Refreshed user session:', data.user)
              setAuth(data.token, data.user)
              // If role changed, reload the page
              if (user.role !== data.user.role) {
                console.log('AuthProvider: Role changed from', user.role, 'to', data.user.role, '- reloading page')
                window.location.reload()
                return
              }
            }
          } catch (error) {
            console.error('AuthProvider: Failed to refresh user session:', error)
          }
        }

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

