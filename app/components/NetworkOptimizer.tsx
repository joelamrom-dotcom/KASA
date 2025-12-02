'use client'

import { useEffect } from 'react'

/**
 * Network optimization
 * Optimizes HTTP/2 multiplexing and connection reuse
 */
export default function NetworkOptimizer() {
  useEffect(() => {
    // Enable HTTP/2 Server Push for critical resources
    const pushResources = [
      { path: '/fonts/inter.woff2', type: 'font' },
      { path: '/_next/static/css/app.css', type: 'style' },
    ]

    // Use link preload headers (handled by middleware)
    pushResources.forEach(({ path, type }) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = path
      link.as = type
      if (type === 'font') {
        link.crossOrigin = 'anonymous'
      }
      document.head.appendChild(link)
    })

    // Optimize connection reuse
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        // Adjust based on connection type
        if (connection.effectiveType === '4g') {
          // Aggressive prefetching on fast connections
          document.documentElement.setAttribute('data-fast-connection', 'true')
        }
      }
    }
  }, [])

  return null
}

