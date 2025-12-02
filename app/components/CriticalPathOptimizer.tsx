'use client'

import { useEffect } from 'react'

/**
 * Critical path optimization
 * Eliminates render-blocking resources
 */
export default function CriticalPathOptimizer() {
  useEffect(() => {
    // Defer non-critical CSS
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])')
    stylesheets.forEach((link) => {
      if (link instanceof HTMLLinkElement) {
        link.media = 'print'
        link.onload = () => {
          link.media = 'all'
        }
      }
    })

    // Defer non-critical JavaScript
    const scripts = document.querySelectorAll('script:not([data-critical])')
    scripts.forEach((script) => {
      if (script instanceof HTMLScriptElement && !script.defer && !script.async) {
        script.defer = true
      }
    })

    // Preload critical resources
    const criticalResources = [
      { href: '/_next/static/css/app.css', as: 'style' },
      { href: '/_next/static/chunks/main.js', as: 'script' },
    ]

    criticalResources.forEach(({ href, as }) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = as
      link.setAttribute('fetchpriority', 'high')
      document.head.appendChild(link)
    })
  }, [])

  return null
}

