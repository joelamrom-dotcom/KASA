'use client'

import { useEffect } from 'react'

/**
 * Resource prioritization
 * Ensures critical resources load first
 */
export default function ResourcePrioritizer() {
  useEffect(() => {
    // Prioritize critical resources
    const criticalResources = [
      { href: '/globals.css', as: 'style', priority: 'high' },
      { href: '/fonts/inter.woff2', as: 'font', priority: 'high' },
    ]

    criticalResources.forEach(({ href, as, priority }) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = as
      if (priority === 'high') {
        link.setAttribute('fetchpriority', 'high')
      }
      document.head.appendChild(link)
    })

    // Lower priority for non-critical resources
    const lowPriorityResources = document.querySelectorAll(
      'link[rel="stylesheet"]:not([data-critical])'
    )
    lowPriorityResources.forEach((link) => {
      if (link instanceof HTMLLinkElement) {
        link.setAttribute('fetchpriority', 'low')
      }
    })
  }, [])

  return null
}

