'use client'

import { useEffect } from 'react'

/**
 * Preload key requests
 * Aggressively preloads critical resources
 */
export default function PreloadKeyRequests() {
  useEffect(() => {
    // Preload critical API endpoints
    const criticalAPIs = [
      '/api/kasa/dashboard',
      '/api/kasa/families',
    ]

    criticalAPIs.forEach((api) => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = api
      link.as = 'fetch'
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })

    // Preload critical routes
    const criticalRoutes = [
      '/families',
      '/payments',
      '/dashboard',
    ]

    criticalRoutes.forEach((route) => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = route
      link.as = 'document'
      document.head.appendChild(link)
    })

    // Preload critical fonts with highest priority
    const criticalFonts = [
      { href: '/fonts/inter-var.woff2', type: 'font/woff2' },
    ]

    criticalFonts.forEach(({ href, type }) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = 'font'
      link.type = type
      link.crossOrigin = 'anonymous'
      link.setAttribute('fetchpriority', 'high')
      document.head.appendChild(link)
    })
  }, [])

  return null
}

