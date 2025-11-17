'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function GoogleAuthSuccessContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams?.get('token')
    const userParam = searchParams?.get('user')

    if (token && userParam) {
      try {
        const user = JSON.parse(userParam)
        
        // Clear any old/stale tokens first to prevent conflicts
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('token', token)
        
        // Set cookie for server-side access
        document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}` // 7 days
        
        // Verify data was stored
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')
        
        if (!storedToken || !storedUser) {
          throw new Error('Failed to store authentication data')
        }
        
        // Small delay to ensure localStorage is persisted and AuthProvider can read it
        setTimeout(() => {
          // Force a hard redirect to ensure AuthProvider re-checks
          window.location.replace('/')
        }, 100)
      } catch (error) {
        console.error('Error parsing user data:', error)
        window.location.href = '/login?error=' + encodeURIComponent('Failed to process authentication')
      }
    } else {
      window.location.href = '/login?error=' + encodeURIComponent('Missing authentication data')
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}

export default function GoogleAuthSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <GoogleAuthSuccessContent />
    </Suspense>
  )
}

