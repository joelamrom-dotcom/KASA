'use client'

import { useState, useRef, useEffect } from 'react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

interface TooltipProps {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  children?: React.ReactNode
  className?: string
  showIcon?: boolean
}

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrowClasses = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700',
}

export default function Tooltip({
  content,
  position = 'top',
  children,
  className = '',
  showIcon = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltip = tooltipRef.current
      const trigger = triggerRef.current
      const rect = trigger.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()

      // Adjust position if tooltip goes off screen
      if (position === 'top' && rect.top - tooltipRect.height < 0) {
        tooltip.classList.remove('bottom-full', 'mb-2')
        tooltip.classList.add('top-full', 'mt-2')
      }
      if (position === 'bottom' && rect.bottom + tooltipRect.height > window.innerHeight) {
        tooltip.classList.remove('top-full', 'mt-2')
        tooltip.classList.add('bottom-full', 'mb-2')
      }
    }
  }, [isVisible, position])

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children || (
        <button
          type="button"
          className="inline-flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
          aria-label="More information"
        >
          {showIcon && <InformationCircleIcon className="h-4 w-4" />}
        </button>
      )}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap ${positionClasses[position]}`}
          role="tooltip"
        >
          {content}
          <div
            className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  )
}

