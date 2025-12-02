'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'

export default function PWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Install Kasa App</h3>
            <p className="text-sm text-gray-600">Add to your home screen for quick access</p>
          </div>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <XMarkIcon className="h-5 w-5 text-gray-400" />
        </button>
      </div>
      <button
        onClick={handleInstall}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Install
      </button>
    </div>
  )
}

