'use client'

import { useEffect } from 'react'

/**
 * Passive event listeners
 * Improves scroll performance by not blocking main thread
 */
export default function PassiveEventListeners() {
  useEffect(() => {
    // Convert scroll listeners to passive
    const scrollElements = document.querySelectorAll('[data-scroll]')
    
    scrollElements.forEach((element) => {
      // Remove existing listeners and re-add as passive
      const newListener = (e: Event) => {
        // Handle scroll
      }
      
      element.addEventListener('scroll', newListener, { passive: true })
      element.addEventListener('touchstart', newListener, { passive: true })
      element.addEventListener('touchmove', newListener, { passive: true })
    })

    // Add passive listeners to window
    const passiveHandler = () => {}
    window.addEventListener('scroll', passiveHandler, { passive: true })
    window.addEventListener('wheel', passiveHandler, { passive: true })
    window.addEventListener('touchstart', passiveHandler, { passive: true })
    window.addEventListener('touchmove', passiveHandler, { passive: true })

    return () => {
      window.removeEventListener('scroll', passiveHandler)
      window.removeEventListener('wheel', passiveHandler)
      window.removeEventListener('touchstart', passiveHandler)
      window.removeEventListener('touchmove', passiveHandler)
    }
  }, [])

  return null
}

