'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      // Only register service worker in production or if explicitly enabled
      const isProduction = process.env.NODE_ENV === 'production'
      const enableServiceWorker = process.env.NEXT_PUBLIC_ENABLE_SW !== 'false'
      
      if (isProduction && enableServiceWorker) {
        // Register service worker with proper scope
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('Service Worker registered:', registration.scope)

            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker available
                    if (confirm('New version available! Reload to update?')) {
                      window.location.reload()
                    }
                  }
                })
              }
            })
          })
          .catch((error) => {
            // Silently fail in development, log in production
            if (isProduction) {
              console.warn('Service Worker registration failed (non-critical):', error.message)
            }
          })

        // Check for updates on page load
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })
      }
    }
  }, [])

  return null
}

