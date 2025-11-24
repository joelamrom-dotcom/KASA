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
}: ModalProps) {
  const justOpenedRef = useRef(false)
  const openTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      justOpenedRef.current = true
      openTimeRef.current = Date.now()
      document.body.style.overflow = 'hidden'
      // Reset the flag after a short delay to allow normal closing
      setTimeout(() => {
        justOpenedRef.current = false
      }, 100)
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
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent closing if modal was just opened (within last 100ms)
    if (justOpenedRef.current || (openTimeRef.current && Date.now() - openTimeRef.current < 100)) {
      console.log('Modal just opened - preventing backdrop close')
      return
    }

    // Only close if clicking directly on the backdrop element itself
    // Check if the click target is the backdrop div, not any child element
    const target = e.target as HTMLElement
    const currentTarget = e.currentTarget as HTMLElement
    
    // Only close if clicking exactly on the backdrop (not on any child)
    if (target === currentTarget) {
      console.log('Backdrop clicked - closing modal')
      onClose()
    } else {
      console.log('Click was on modal content, not backdrop - preventing close')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleBackdropClick}
      onMouseDown={(e) => {
        // Prevent any mousedown events from propagating
        const target = e.target as HTMLElement
        const currentTarget = e.currentTarget as HTMLElement
        if (target !== currentTarget) {
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

