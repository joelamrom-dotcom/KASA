'use client'

import { ReactNode, useEffect } from 'react'

interface AccessibilityWrapperProps {
  children: ReactNode
}

export default function AccessibilityWrapper({ children }: AccessibilityWrapperProps) {
  useEffect(() => {
    // Add ARIA landmarks
    const main = document.querySelector('main')
    if (main && !main.getAttribute('role')) {
      main.setAttribute('role', 'main')
      main.setAttribute('aria-label', 'Main content')
    }

    // Add skip to main content link
    if (!document.getElementById('skip-to-main')) {
      const skipLink = document.createElement('a')
      skipLink.id = 'skip-to-main'
      skipLink.href = '#main-content'
      skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded'
      skipLink.textContent = 'Skip to main content'
      document.body.insertBefore(skipLink, document.body.firstChild)
    }

    // Keyboard navigation enhancements
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key closes modals
      if (e.key === 'Escape') {
        const modals = document.querySelectorAll('[role="dialog"]')
        modals.forEach(modal => {
          const closeButton = modal.querySelector('[aria-label*="close"], [aria-label*="Close"]')
          if (closeButton) {
            (closeButton as HTMLElement).click()
          }
        })
      }

      // Tab navigation trap in modals
      if (e.key === 'Tab') {
        const modal = document.activeElement?.closest('[role="dialog"]')
        if (modal) {
          const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          const firstElement = focusableElements[0] as HTMLElement
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return <>{children}</>
}

