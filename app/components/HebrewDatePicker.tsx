'use client'

import { useState, useEffect, useRef } from 'react'
import { ReactJewishDatePicker, BasicJewishDay } from 'react-jewish-datepicker'
import 'react-jewish-datepicker/dist/index.css'

interface HebrewDatePickerProps {
  value: string
  onChange: (date: string) => void
  required?: boolean
}

export default function HebrewDatePicker({ value, onChange, required = false }: HebrewDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Suppress the onMouseOver error globally for this component
    const originalError = window.onerror
    window.onerror = (message, source, lineno, colno, error) => {
      if (message?.toString().includes('onMouseOver') || message?.toString().includes('day.js')) {
        return true // Suppress the error
      }
      if (originalError) {
        return originalError(message, source, lineno, colno, error)
      }
      return false
    }

    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
    }

    return () => {
      window.onerror = originalError
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleDateSelect = (day: BasicJewishDay | null) => {
    if (day) {
      // Access properties safely - BasicJewishDay may have different property names
      const dayValue = (day as any).day || (day as any).date || (day as any).dayOfMonth
      const monthName = (day as any).monthName || (day as any).month
      const year = (day as any).year
      
      if (dayValue && monthName && year) {
        const hebrewDate = `${dayValue} ${monthName} ${year}`
        onChange(hebrewDate)
        setIsOpen(false)
      }
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          required={required}
          value={value}
          readOnly
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5"
          placeholder="Click to select Hebrew date"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' /%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.75rem center',
            backgroundSize: '1.25rem 1.25rem'
          }}
        />
      </div>
      {isOpen && (
        <div 
          className="absolute z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onMouseEnter={(e) => e.stopPropagation()}
          onMouseLeave={(e) => e.stopPropagation()}
          onMouseOver={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseEnter={(e) => e.stopPropagation()}
            onMouseLeave={(e) => e.stopPropagation()}
            onMouseOver={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            style={{ pointerEvents: 'auto' }}
            ref={(el) => {
              if (el) {
                // Patch all child elements to prevent the error
                const patchElements = (element: HTMLElement) => {
                  if (element.onmouseover === null || element.onmouseover === undefined) {
                    element.onmouseover = () => {}
                  }
                  Array.from(element.children).forEach((child) => {
                    if (child instanceof HTMLElement) {
                      patchElements(child)
                    }
                  })
                }
                // Use MutationObserver to patch dynamically added elements
                const observer = new MutationObserver(() => {
                  patchElements(el)
                })
                observer.observe(el, { childList: true, subtree: true })
                patchElements(el)
                // Cleanup
                return () => observer.disconnect()
              }
            }}
          >
            <ReactJewishDatePicker
              onClick={(day: BasicJewishDay | null) => {
                handleDateSelect(day)
              }}
              isHebrew={true}
              isRange={false}
            />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
            className="mt-2 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}

