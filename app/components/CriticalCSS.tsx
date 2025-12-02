'use client'

import { useEffect } from 'react'

/**
 * Critical CSS inlining
 * Inlines critical CSS for above-the-fold content
 */
export default function CriticalCSS() {
  useEffect(() => {
    // Critical CSS for above-the-fold content
    const criticalCSS = `
      body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
      .bg-gray-50 { background-color: #f9fafb; }
      .min-h-screen { min-height: 100vh; }
    `

    const style = document.createElement('style')
    style.textContent = criticalCSS
    style.setAttribute('data-critical', 'true')
    document.head.appendChild(style)

    // Load full CSS asynchronously
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '/globals.css'
    link.media = 'print'
    link.onload = () => {
      link.media = 'all'
    }
    document.head.appendChild(link)
  }, [])

  return null
}

