'use client'

import { useEffect } from 'react'

/**
 * Preload critical resources for instant loading
 */
export default function PreloadCriticalResources() {
  useEffect(() => {
    // Preload critical JavaScript
    const criticalScripts = [
      '/_next/static/chunks/main.js',
      '/_next/static/chunks/webpack.js',
    ]

    criticalScripts.forEach((src) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = src
      link.as = 'script'
      link.setAttribute('fetchpriority', 'high')
      document.head.appendChild(link)
    })

    // Preload critical CSS
    const criticalCSS = document.querySelector('link[rel="stylesheet"]')
    if (criticalCSS) {
      criticalCSS.setAttribute('fetchpriority', 'high')
    }

    // Preload critical fonts
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

