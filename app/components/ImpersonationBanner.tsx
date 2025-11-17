'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { getUser, setAuth } from '@/lib/auth'

export default function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [impersonatedUser, setImpersonatedUser] = useState<any>(null)
  const [adminUser, setAdminUser] = useState<any>(null)

  useEffect(() => {
    // Check if currently impersonating by decoding the token
    const checkImpersonation = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setIsImpersonating(false)
          return
        }

        // Decode token (without verification, just to check for impersonatedBy)
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
        const decoded = JSON.parse(jsonPayload)

        if (decoded.impersonatedBy) {
          setIsImpersonating(true)
          setImpersonatedUser({
            email: decoded.email,
            userId: decoded.userId,
          })
          setAdminUser({
            email: decoded.impersonatedByEmail,
            userId: decoded.impersonatedBy,
          })
        } else {
          setIsImpersonating(false)
        }
      } catch (error) {
        console.error('Error checking impersonation:', error)
        setIsImpersonating(false)
      }
    }

    checkImpersonation()
  }, [])

  const handleExitImpersonation = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/auth/exit-impersonation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Exit impersonation error response:', errorData)
        throw new Error(errorData.error || 'Failed to exit impersonation')
      }

      const data = await response.json()
      
      // Clear old tokens first
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Set the new token and user data
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      // Set cookie for server-side access
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`
      
      // Reload the page to refresh the UI
      window.location.replace('/')
    } catch (error) {
      console.error('Error exiting impersonation:', error)
      alert('Failed to exit impersonation. Please try again.')
    }
  }

  if (!isImpersonating) {
    return null
  }

  return (
    <div className="sticky top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                You are viewing as: <span className="font-bold">{impersonatedUser?.email}</span>
              </p>
              <p className="text-xs opacity-90">
                Logged in as: {adminUser?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            Exit Impersonation
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

