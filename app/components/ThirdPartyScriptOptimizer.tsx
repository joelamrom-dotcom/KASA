'use client'

import { useEffect } from 'react'
import Script from 'next/script'

/**
 * Optimizes third-party script loading
 * Defers non-critical scripts to improve initial load
 */
export default function ThirdPartyScriptOptimizer() {
  useEffect(() => {
    // Defer non-critical scripts
    const scripts = document.querySelectorAll('script[data-defer]')
    scripts.forEach((script) => {
      if (script instanceof HTMLScriptElement) {
        script.defer = true
      }
    })
  }, [])

  return (
    <>
      {/* Load critical scripts with priority */}
      <Script
        src="/critical.js"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log('Critical script loaded')
        }}
      />
      
      {/* Defer non-critical scripts */}
      <Script
        src="/analytics.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('Analytics loaded')
        }}
      />
    </>
  )
}

