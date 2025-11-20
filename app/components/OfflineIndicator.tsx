'use client'

import { useState, useEffect } from 'react'
import { WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center text-sm z-50 safe-top">
      <div className="flex items-center justify-center gap-2">
        <SignalSlashIcon className="h-5 w-5" />
        <span>You're offline. Some features may be limited.</span>
      </div>
    </div>
  )
}

