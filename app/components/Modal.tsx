'use client'

import { useEffect, useRef } from 'react'
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

  useEffect(() => {
    if (isOpen) {
      justOpenedRef.current = true
      openTimeRef.current = Date.now()
      preventBackdropClickRef.current = true
      document.body.style.overflow = 'hidden'
      
      // Prevent backdrop clicks for a longer period to catch any delayed click events
      setTimeout(() => {
        justOpenedRef.current = false
        console.log('Modal opening guard disabled')
      }, 1000)
      
      // Keep preventing backdrop clicks for even longer to catch any event propagation issues
      setTimeout(() => {
        preventBackdropClickRef.current = false
        console.log('Modal backdrop click prevention disabled')
      }, 2000)
    } else {
      document.body.style.overflow = 'unset'
      justOpenedRef.current = false
      openTimeRef.current = null
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    if (disableEscapeKey) {
      return
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        // Prevent closing if modal was just opened
        if (justOpenedRef.current || (openTimeRef.current && Date.now() - openTimeRef.current < 200)) {
          console.log('Escape key prevented - modal just opened')
          return
        }
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, disableEscapeKey])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If backdrop clicks are disabled, never close
    if (disableBackdropClick) {
      console.log('Modal backdrop click disabled by prop')
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    // Prevent closing if modal was just opened or if backdrop clicks are prevented
    const timeSinceOpen = openTimeRef.current ? Date.now() - openTimeRef.current : Infinity
    if (justOpenedRef.current || preventBackdropClickRef.current || timeSinceOpen < 2000) {
      console.log('Modal backdrop click prevented', {
        justOpened: justOpenedRef.current,
        preventBackdropClick: preventBackdropClickRef.current,
        timeSinceOpen: timeSinceOpen < Infinity ? `${timeSinceOpen}ms` : 'never opened'
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
      onClose()
    } else {
      console.log('Click was on modal content, not backdrop - preventing close', {
        targetTag: target.tagName,
        currentTargetTag: currentTarget.tagName
      })
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={disableBackdropClick ? (e) => {
        // Completely prevent any backdrop clicks when disabled
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
          e.stopPropagation()
          e.preventDefault()
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
      >
        {(title || showCloseButton) && (
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
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
}

