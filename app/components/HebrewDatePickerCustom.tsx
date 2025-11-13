'use client'

import { useState, useEffect, useRef } from 'react'
import { HDate } from '@hebcal/core'
import { CalendarIcon } from '@heroicons/react/24/outline'

interface HebrewDatePickerProps {
  value: string
  onChange: (date: string) => void
  required?: boolean
}

const HEBREW_MONTHS = [
  'Nisan', 'Iyar', 'Sivan', 'Tammuz', 'Av', 'Elul',
  'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar'
]

const HEBREW_MONTH_NAMES: Record<number, string> = {
  1: 'Nisan', 2: 'Iyar', 3: 'Sivan', 4: 'Tammuz', 5: 'Av', 6: 'Elul',
  7: 'Tishrei', 8: 'Cheshvan', 9: 'Kislev', 10: 'Tevet', 11: 'Shevat', 12: 'Adar'
}

export default function HebrewDatePickerCustom({ value, onChange, required = false }: HebrewDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<HDate | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (value) {
      try {
        const parts = value.trim().split(' ')
        if (parts.length >= 3) {
          const day = parseInt(parts[0])
          const monthName = parts[1]
          const year = parseInt(parts[2])
          const monthIndex = HEBREW_MONTHS.indexOf(monthName)
          if (monthIndex >= 0 && !isNaN(day) && !isNaN(year)) {
            const monthNum = monthIndex >= 6 ? monthIndex + 1 : monthIndex + 1
            setSelectedDate(new HDate(day, monthNum, year))
          }
        }
      } catch (e) {
        // Invalid date format
      }
    }
  }, [value])

  const handleDateSelect = (day: number, month: number, year: number) => {
    try {
      const hdate = new HDate(day, month, year)
      const monthName = HEBREW_MONTH_NAMES[month] || HEBREW_MONTHS[month - 1] || ''
      const dateString = `${day} ${monthName} ${year}`
      setSelectedDate(hdate)
      onChange(dateString)
      setIsOpen(false)
    } catch (e) {
      console.error('Error selecting date:', e)
    }
  }

  const today = new HDate()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const [displayYear, setDisplayYear] = useState(currentYear)
  const [displayMonth, setDisplayMonth] = useState(currentMonth)

  const getDaysInMonth = (year: number, month: number) => {
    try {
      const hdate = new HDate(1, month, year)
      const days = []
      const daysInMonth = hdate.daysInMonth()
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(day)
      }
      return days
    } catch {
      return []
    }
  }

  const getDayOfWeek = (day: number, month: number, year: number) => {
    try {
      const hdate = new HDate(day, month, year)
      return hdate.getDay()
    } catch {
      return 0
    }
  }

  const days = getDaysInMonth(displayYear, displayMonth)
  const firstDayOfWeek = days.length > 0 ? getDayOfWeek(1, displayMonth, displayYear) : 0

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
          className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
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
          className="absolute z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => {
                  if (displayMonth === 1) {
                    setDisplayYear(displayYear - 1)
                    setDisplayMonth(12)
                  } else {
                    setDisplayMonth(displayMonth - 1)
                  }
                }}
                className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
              >
                ‹
              </button>
              <div className="text-center font-semibold">
                {HEBREW_MONTH_NAMES[displayMonth] || HEBREW_MONTHS[displayMonth - 1] || ''} {displayYear}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (displayMonth === 12) {
                    setDisplayYear(displayYear + 1)
                    setDisplayMonth(1)
                  } else {
                    setDisplayMonth(displayMonth + 1)
                  }
                }}
                className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day, idx) => (
                <div key={idx} className="text-center text-xs font-semibold text-gray-600 p-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array(firstDayOfWeek).fill(null).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square" />
              ))}
              {days.map((day) => {
                const isSelected = selectedDate && 
                  selectedDate.getDate() === day && 
                  selectedDate.getMonth() === displayMonth && 
                  selectedDate.getFullYear() === displayYear
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDateSelect(day, displayMonth, displayYear)}
                    className={`aspect-square p-1 text-sm rounded hover:bg-blue-100 transition-colors ${
                      isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}

