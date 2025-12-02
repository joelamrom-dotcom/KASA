'use client'

import { useEffect } from 'react'

/**
 * Reduce JavaScript execution time
 * Defers non-critical JavaScript execution
 */
export default function ReduceJSExecution() {
  useEffect(() => {
    // Defer all non-critical scripts
    const scripts = document.querySelectorAll('script[data-defer]')
    scripts.forEach((script) => {
      if (script instanceof HTMLScriptElement) {
        script.defer = true
        script.async = true
      }
    })

    // Use requestIdleCallback for non-critical work
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        // Load non-critical features
        import('./NonCriticalFeatures').catch(console.error)
      }, { timeout: 2000 })
    }

    // Reduce JavaScript execution by using CSS for animations
    const style = document.createElement('style')
    style.textContent = `
      /* Use CSS animations instead of JavaScript */
      .fade-in {
        animation: fadeIn 0.3s ease-in;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .slide-in {
        animation: slideIn 0.3s ease-out;
      }
      
      @keyframes slideIn {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
    `
    document.head.appendChild(style)
  }, [])

  return null
}

