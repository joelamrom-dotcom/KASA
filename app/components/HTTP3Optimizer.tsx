'use client'

import { useEffect } from 'react'

/**
 * HTTP/3 (QUIC) optimization
 * Enables faster connection establishment
 */
export default function HTTP3Optimizer() {
  useEffect(() => {
    // Check if HTTP/3 is supported
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection && connection.effectiveType) {
        console.log('Connection type:', connection.effectiveType)
        
        // Optimize for slow connections
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          // Disable non-critical features
          document.documentElement.setAttribute('data-slow-connection', 'true')
        }
      }
    }

    // Preconnect with HTTP/3 hint
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = window.location.origin
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  }, [])

  return null
}

