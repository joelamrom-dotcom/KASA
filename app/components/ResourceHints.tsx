'use client'

import { useEffect } from 'react'
import Head from 'next/head'

/**
 * Resource hints component for performance optimization
 * Preloads critical resources and prefetches likely next pages
 */
export default function ResourceHints() {
  useEffect(() => {
    // Preload critical fonts
    const fontPreloads = [
      { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
    ]

    fontPreloads.forEach(({ href, as, type, crossOrigin }) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = as
      if (type) link.type = type
      if (crossOrigin) link.crossOrigin = crossOrigin
      document.head.appendChild(link)
    })

    // Prefetch DNS for external resources
    const dnsPrefetch = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ]

    dnsPrefetch.forEach((domain) => {
      const link = document.createElement('link')
      link.rel = 'dns-prefetch'
      link.href = domain
      document.head.appendChild(link)
    })

    // Preconnect to critical origins
    const preconnects = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ]

    preconnects.forEach((origin) => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = origin
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })
  }, [])

  return null
}

