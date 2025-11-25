'use client'

import React from 'react'
import { ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import Modal from './Modal'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  type?: 'danger' | 'warning' | 'info' | 'success'
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
}: ConfirmationDialogProps) {
  const openingTimeRef = React.useRef<number | null>(null)
  const isOpeningRef = React.useRef(false)
  // Internal state to override isOpen prop when dialog was just opened
  const [internalIsOpen, setInternalIsOpen] = React.useState(false)
  const shouldStayOpenRef = React.useRef(false)

  // Prevent closing during loading or immediately after opening
  const handleClose = React.useCallback(() => {
    if (isLoading) {
      console.log('ConfirmationDialog: handleClose prevented - isLoading is true')
      return
    }
    
    // Prevent closing if dialog was just opened (within 3000ms = 3 seconds)
    // This prevents accidental closes from event propagation
    const timeSinceOpen = openingTimeRef.current ? Date.now() - openingTimeRef.current : Infinity
    if (timeSinceOpen < 3000) {
      console.log('ConfirmationDialog: handleClose prevented - dialog just opened', {
        timeSinceOpen: `${timeSinceOpen}ms`,
        openingTime: openingTimeRef.current,
        isOpening: isOpeningRef.current,
        isOpen: isOpen
      })
      console.trace('Stack trace for prevented close')
      return
    }
    
    // Also prevent if the opening flag is still set
    if (isOpeningRef.current) {
      console.log('ConfirmationDialog: handleClose prevented - isOpening flag is true')
      return
    }
    
    // Double check that dialog is actually open
    if (!isOpen && !internalIsOpen) {
      console.log('ConfirmationDialog: handleClose prevented - dialog is not open')
      return
    }
    
    // If we're in the "should stay open" period, prevent close
    if (shouldStayOpenRef.current) {
      const timeSinceOpen = openingTimeRef.current ? Date.now() - openingTimeRef.current : Infinity
      if (timeSinceOpen < 10000) {
        console.log('ConfirmationDialog: handleClose prevented - should stay open period active', {
          timeSinceOpen: `${timeSinceOpen}ms`
        })
        return
      }
    }
    
    // Clear the should stay open flag
    shouldStayOpenRef.current = false
    setInternalIsOpen(false)
    
    console.log('ConfirmationDialog: handleClose called - allowing close', {
      timeSinceOpen: timeSinceOpen < Infinity ? `${timeSinceOpen}ms` : 'never opened'
    })
    console.trace('Stack trace for handleClose')
    onClose()
  }, [isLoading, isOpen, internalIsOpen, onClose])

  // Log when dialog opens/closes for debugging and manage internal state
  React.useEffect(() => {
    if (isOpen) {
      // Set the opening time immediately when dialog opens
      const openTime = Date.now()
      openingTimeRef.current = openTime
      isOpeningRef.current = true
      shouldStayOpenRef.current = true
      setInternalIsOpen(true)
      console.log('ConfirmationDialog: Dialog opened', { title, message, openTime })
      // Reset opening flag after a delay to allow normal closing
      setTimeout(() => {
        isOpeningRef.current = false
        shouldStayOpenRef.current = false
        console.log('ConfirmationDialog: Opening guard disabled', {
          timeSinceOpen: Date.now() - openTime
        })
      }, 10000) // Extended to 10 seconds to match parent guard
    } else {
      // Only close if we're not in the "should stay open" period
      const timeSinceOpen = openingTimeRef.current ? Date.now() - openingTimeRef.current : Infinity
      if (shouldStayOpenRef.current && timeSinceOpen < 10000) {
        console.warn('ConfirmationDialog: Prevented premature close - forcing dialog to stay open', {
          timeSinceOpen: `${timeSinceOpen}ms`,
          isOpening: isOpeningRef.current,
          shouldStayOpen: shouldStayOpenRef.current
        })
        // Force it to stay open - don't update internalIsOpen to false
        // The internalIsOpen should already be true from when it opened
        if (!internalIsOpen) {
          setInternalIsOpen(true)
        }
        return
      }
      // Allow normal close only if guard period has passed
      openingTimeRef.current = null
      isOpeningRef.current = false
      shouldStayOpenRef.current = false
      setInternalIsOpen(false)
      console.log('ConfirmationDialog: Dialog closed')
    }
  }, [isOpen, title, message, internalIsOpen])
  
  const icons = {
    danger: ExclamationTriangleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
    success: CheckCircleIcon,
  }

  const colors = {
    danger: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
    warning: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',
    info: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
    success: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
  }

  const buttonColors = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  }

  const Icon = icons[type]

  // Memoize the modal to prevent unnecessary re-renders
  // Use a stable key that doesn't change when effectiveIsOpen changes during guard period
  const modalKey = React.useMemo(() => `confirmation-${title}-${openingTimeRef.current || 'new'}`, [title])
  
  // Calculate effectiveIsOpen - prefer internal state when guard is active
  const effectiveIsOpen = React.useMemo(() => {
    if (shouldStayOpenRef.current) {
      // During guard period, always return true if we were ever open
      return internalIsOpen || isOpen
    }
    // After guard period, use the prop
    return isOpen
  }, [isOpen, internalIsOpen])
  
  console.log('ConfirmationDialog: Rendering with effectiveIsOpen', {
    effectiveIsOpen,
    isOpen,
    internalIsOpen,
    shouldStayOpen: shouldStayOpenRef.current,
    timeSinceOpen: openingTimeRef.current ? Date.now() - openingTimeRef.current : null
  })
  
  return (
    <Modal 
      key={modalKey}
      isOpen={effectiveIsOpen} 
      onClose={handleClose} 
      title="" 
      showCloseButton={false}
      disableBackdropClick={true}
      disableEscapeKey={true}
    >
      <div 
        className="p-6"
        onClick={(e) => {
          // Prevent any clicks inside the dialog from propagating
          e.stopPropagation()
        }}
        onMouseDown={(e) => {
          // Prevent mousedown events from propagating
          e.stopPropagation()
        }}
      >
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 p-3 rounded-full ${colors[type]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  e.nativeEvent.stopImmediatePropagation()
                  handleClose()
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  e.nativeEvent.stopImmediatePropagation()
                  onConfirm()
                }}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonColors[type]}`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
