'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ModalProps {
  title?: string
  children: React.ReactNode
  onClose: () => void
  isOpen: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  className?: string
  disableBackdropClick?: boolean // Disable closing when clicking outside
  disableEscapeKey?: boolean // Disable closing with Escape key
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
}

export default function Modal({
  title,
  children,
  onClose,
  isOpen,
  size = 'md',
  showCloseButton = true,
  className = '',
  disableBackdropClick = false,
  disableEscapeKey = false,
}: ModalProps) {
  const justOpenedRef = useRef(false)
  const openTimeRef = useRef<number | null>(null)
  const preventBackdropClickRef = useRef(false)
  
  // Wrapper for onClose that respects disableBackdropClick
  const safeOnClose = useCallback(() => {
    if (disableBackdropClick) {
      // When disableBackdropClick is true, NEVER allow programmatic closes
      // Only allow closes from explicit user actions (Cancel/Confirm buttons)
      console.log('Modal onClose prevented - disableBackdropClick is true, only explicit button clicks can close', {
        timeSinceOpen: openTimeRef.current ? Date.now() - openTimeRef.current : Infinity
      })
      return
    }
    // For normal modals, check guard duration
    const timeSinceOpen = openTimeRef.current ? Date.now() - openTimeRef.current : Infinity
    if (timeSinceOpen < 3000) {
      console.log('Modal onClose prevented - guard is active', {
        timeSinceOpen: timeSinceOpen < Infinity ? `${timeSinceOpen}ms` : 'never opened'
      })
      return
    }
    onClose()
  }, [onClose, disableBackdropClick])

  useEffect(() => {
    if (isOpen) {
      justOpenedRef.current = true
      openTimeRef.current = Date.now()
      preventBackdropClickRef.current = true
      document.body.style.overflow = 'hidden'
      
      // If backdrop clicks are disabled, keep the guard active permanently
      // Otherwise, use a shorter guard duration
      const guardDuration = disableBackdropClick ? Infinity : 3000
      
      // Prevent backdrop clicks for a longer period to catch any delayed click events
      // If disableBackdropClick is true, NEVER disable the guard
      if (!disableBackdropClick) {
        setTimeout(() => {
          justOpenedRef.current = false
          console.log('Modal opening guard disabled', { disableBackdropClick, guardDuration })
        }, guardDuration)
      } else {
        // Keep it enabled permanently when disableBackdropClick is true
        console.log('Modal opening guard enabled permanently (disableBackdropClick=true)')
      }
      
      // Keep preventing backdrop clicks for even longer to catch any event propagation issues
      // If disableBackdropClick is true, never disable this guard
      if (!disableBackdropClick) {
        setTimeout(() => {
          preventBackdropClickRef.current = false
          console.log('Modal backdrop click prevention disabled')
        }, guardDuration + 1000)
      } else {
        // Keep it enabled permanently when disableBackdropClick is true
        console.log('Modal backdrop click prevention enabled permanently (disableBackdropClick=true)')
      }
    } else {
      document.body.style.overflow = 'unset'
      justOpenedRef.current = false
      openTimeRef.current = null
      preventBackdropClickRef.current = false
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, disableBackdropClick])

  useEffect(() => {
    if (disableEscapeKey) {
      return
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        // Prevent closing if modal was just opened or if backdrop clicks are disabled
        const timeSinceOpen = openTimeRef.current ? Date.now() - openTimeRef.current : Infinity
        // If disableBackdropClick is true, the guard duration is effectively infinite
        const guardDuration = disableBackdropClick ? Infinity : 3000
        if (justOpenedRef.current || preventBackdropClickRef.current || (timeSinceOpen < guardDuration && guardDuration !== Infinity)) {
          console.log('Escape key prevented - modal just opened or guard active', {
            justOpened: justOpenedRef.current,
            preventBackdropClick: preventBackdropClickRef.current,
            timeSinceOpen: timeSinceOpen < Infinity ? `${timeSinceOpen}ms` : 'never opened',
            guardDuration
          })
          return
        }
        safeOnClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, safeOnClose, disableEscapeKey, disableBackdropClick])

  // Debug logging for render
  useEffect(() => {
    console.log('Modal: isOpen prop changed', {
      isOpen,
      disableBackdropClick,
      timestamp: Date.now()
    })
  }, [isOpen, disableBackdropClick])
  
  if (!isOpen) {
    console.log('Modal: Returning null because isOpen is false')
    return null
  }
  
  console.log('Modal: Rendering modal', {
    isOpen,
    disableBackdropClick,
    timestamp: Date.now()
  })

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If backdrop clicks are disabled, never close
    if (disableBackdropClick) {
      console.log('Modal backdrop click disabled by prop - preventing close', {
        disableBackdropClick,
        isOpen,
        target: (e.target as HTMLElement)?.tagName,
        currentTarget: (e.currentTarget as HTMLElement)?.tagName
      })
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    // Prevent closing if modal was just opened or if backdrop clicks are prevented
    const timeSinceOpen = openTimeRef.current ? Date.now() - openTimeRef.current : Infinity
    // If disableBackdropClick is true, the guard duration is effectively infinite
    const guardDuration = disableBackdropClick ? Infinity : 3000
    const isGuardActive = justOpenedRef.current || preventBackdropClickRef.current || (timeSinceOpen < guardDuration && guardDuration !== Infinity)
    if (isGuardActive || disableBackdropClick) {
      console.log('Modal backdrop click prevented', {
        justOpened: justOpenedRef.current,
        preventBackdropClick: preventBackdropClickRef.current,
        timeSinceOpen: timeSinceOpen < Infinity ? `${timeSinceOpen}ms` : 'never opened',
        guardDuration,
        disableBackdropClick
      })
      e.preventDefault()
      e.stopPropagation()
      return
    }

    // Only close if clicking directly on the backdrop element itself
    // Check if the click target is the backdrop div, not any child element
    const target = e.target as HTMLElement
    const currentTarget = e.currentTarget as HTMLElement
    
    // Check if the click originated from a button by checking the event path
    const nativeEvent = e.nativeEvent as any
    const path = nativeEvent.path || (nativeEvent.composedPath && nativeEvent.composedPath()) || []
    const clickedButton = path.find((el: any) => {
      if (!el) return false
      return el.tagName === 'BUTTON' || (el.closest && el.closest('button'))
    })
    
    if (clickedButton) {
      console.log('Backdrop click originated from button - preventing close', {
        buttonTag: clickedButton.tagName || 'unknown'
      })
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    // Only close if clicking exactly on the backdrop (not on any child)
    if (target === currentTarget) {
      console.log('Backdrop clicked - closing modal', {
        targetTag: target.tagName,
        currentTargetTag: currentTarget.tagName,
        timeSinceOpen: timeSinceOpen < Infinity ? `${timeSinceOpen}ms` : 'never opened'
      })
      safeOnClose()
    } else {
      console.log('Click was on modal content, not backdrop - preventing close', {
        targetTag: target.tagName,
        currentTargetTag: currentTarget.tagName
      })
    }
  }

  // Use React Portal to ensure modal renders at document body level
  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in"
      style={{ position: 'fixed', zIndex: 9999 }}
      onClick={disableBackdropClick ? (e) => {
        // Completely prevent any backdrop clicks when disabled
        console.log('Modal backdrop click prevented - disableBackdropClick is true', {
          target: (e.target as HTMLElement)?.tagName,
          currentTarget: (e.currentTarget as HTMLElement)?.tagName
        })
        e.preventDefault()
        e.stopPropagation()
      } : handleBackdropClick}
      onMouseDown={(e) => {
        // Prevent any mousedown events from propagating
        const target = e.target as HTMLElement
        const currentTarget = e.currentTarget as HTMLElement
        if (target !== currentTarget) {
          e.stopPropagation()
        }
        // If backdrop clicks are disabled, prevent all mousedown events
        if (disableBackdropClick) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      <div
        className={`
          bg-white dark:bg-gray-800 rounded-xl shadow-2xl
          ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden
          flex flex-col
          animate-slide-up
          ${className}
        `}
        onClick={(e) => {
          // Only stop propagation to prevent backdrop click, don't prevent default
          e.stopPropagation()
        }}
        onMouseDown={(e) => {
          // Only stop propagation to prevent backdrop click, don't prevent default
          e.stopPropagation()
        }}
      >
        {(title || showCloseButton) && (
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={safeOnClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
  
  // Use portal to render at document body level to avoid z-index and stacking context issues
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  
  if (!mounted || typeof window === 'undefined') {
    return null
  }
  
  return createPortal(modalContent, document.body)
}

