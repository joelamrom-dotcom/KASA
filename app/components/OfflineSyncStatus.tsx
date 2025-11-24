'use client'

import { useState, useEffect } from 'react'
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { offlineStorage } from '@/lib/offline-storage'

export default function OfflineSyncStatus() {
  const [status, setStatus] = useState<{
    count: number
    isOnline: boolean
    isSyncing: boolean
  }>({
    count: 0,
    isOnline: navigator.onLine,
    isSyncing: false,
  })

  useEffect(() => {
    const updateStatus = () => {
      const queueStatus = offlineStorage.getQueueStatus()
      setStatus({
        count: queueStatus.count,
        isOnline: queueStatus.isOnline,
        isSyncing: false,
      })
    }

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000)
    updateStatus()

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true, isSyncing: true }))
      setTimeout(() => {
        updateStatus()
        setStatus((prev) => ({ ...prev, isSyncing: false }))
      }, 2000)
    }

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false, isSyncing: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Don't show if online and no pending items
  if (status.isOnline && status.count === 0) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-30">
      <div
        className={`bg-white rounded-lg shadow-lg border p-3 flex items-center gap-3 ${
          status.isOnline ? 'border-green-200' : 'border-yellow-200'
        }`}
      >
        {status.isOnline ? (
          status.isSyncing ? (
            <>
              <ArrowPathIcon className="h-5 w-5 text-blue-600 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Syncing...</p>
                <p className="text-xs text-gray-500">Syncing {status.count} pending items</p>
              </div>
            </>
          ) : status.count > 0 ? (
            <>
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {status.count} item{status.count !== 1 ? 's' : ''} pending sync
                </p>
                <p className="text-xs text-gray-500">Will sync automatically</p>
              </div>
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">All synced</p>
                <p className="text-xs text-gray-500">Everything is up to date</p>
              </div>
            </>
          )
        ) : (
          <>
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">You're offline</p>
              <p className="text-xs text-gray-500">
                {status.count} item{status.count !== 1 ? 's' : ''} will sync when online
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

