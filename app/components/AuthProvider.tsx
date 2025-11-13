'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isAuthenticated, logout } from '@/lib/auth'

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
]

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route))
      
      // If it's a public route, allow access
      if (isPublicRoute) {
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

  // If on public route, render children without sidebar and floating button
  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route))
  if (isPublicRoute) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    )
  }

  // For protected routes, render with layout (sidebar and floating button are in layout)
  return <>{children}</>
}

