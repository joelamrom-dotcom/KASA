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
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('token', token)
        // Set cookie for server-side access
        document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}` // 7 days
        
        // Redirect to home page
        window.location.href = '/'
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

