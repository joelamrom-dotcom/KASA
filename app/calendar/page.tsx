'use client'

import { useState, useEffect } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  type: 'lifecycle_event' | 'task' | 'payment' | 'recurring_payment' | 'wedding' | 'bar_mitzvah' | 'bat_mitzvah'
  color: string
  familyId?: string
  familyName?: string
  memberId?: string
  memberName?: string
  amount?: number
  status?: string
  url?: string
  description?: string
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')

  useEffect(() => {
    fetchEvents()
  }, [currentDate, viewMode])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const start = getStartOfPeriod(currentDate, viewMode)
      const end = getEndOfPeriod(currentDate, viewMode)
      
      const token = localStorage.getItem('token')
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
      
      const res = await fetch(
        `/api/kasa/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`,
        { headers }
      )
      
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStartOfPeriod = (date: Date, mode: string): Date => {
    const d = new Date(date)
    if (mode === 'month') {
      d.setDate(1)
      d.setHours(0, 0, 0, 0)
    } else if (mode === 'week') {
      const day = d.getDay()
      d.setDate(d.getDate() - day)
      d.setHours(0, 0, 0, 0)
    } else {
      d.setHours(0, 0, 0, 0)
    }
    return d
  }

  const getEndOfPeriod = (date: Date, mode: string): Date => {
    const d = new Date(date)
    if (mode === 'month') {
      d.setMonth(d.getMonth() + 1)
      d.setDate(0)
      d.setHours(23, 59, 59, 999)
    } else if (mode === 'week') {
      const day = d.getDay()
      d.setDate(d.getDate() + (6 - day))
      d.setHours(23, 59, 59, 999)
    } else {
      d.setHours(23, 59, 59, 999)
    }
    return d
  }

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: Date[] = []
    
    // Add previous month's trailing days
    const prevMonth = new Date(year, month, 0)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonth.getDate() - i))
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    // Add next month's leading days to fill the grid
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i))
    }
    
    return days
  }

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => {
      const eventDate = new Date(event.start).toISOString().split('T')[0]
      return eventDate === dateStr
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setCurrentDate(newDate)
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth()
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'payment':
      case 'recurring_payment':
        return <CurrencyDollarIcon className="h-4 w-4" />
      case 'lifecycle_event':
      case 'wedding':
      case 'bar_mitzvah':
      case 'bat_mitzvah':
        return <CalendarIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600 mt-1">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  viewMode === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  viewMode === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  viewMode === 'day'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Day
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (viewMode === 'month') navigateMonth('prev')
                  else if (viewMode === 'week') navigateWeek('prev')
                  else navigateDay('prev')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Today
              </button>
              
              <button
                onClick={() => {
                  if (viewMode === 'month') navigateMonth('next')
                  else if (viewMode === 'week') navigateWeek('next')
                  else navigateDay('next')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="text-lg font-semibold">
              {viewMode === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {viewMode === 'week' && `Week of ${getStartOfPeriod(currentDate, 'week').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              {viewMode === 'day' && formatDate(currentDate)}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        {viewMode === 'month' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b">
              {weekDays.map(day => (
                <div key={day} className="p-4 text-center font-semibold text-gray-700 bg-gray-50">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {days.map((day, index) => {
                const dayEvents = getEventsForDate(day)
                const isCurrentMonthDay = isCurrentMonth(day)
                const isTodayDay = isToday(day)

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] border-r border-b p-2 ${
                      !isCurrentMonthDay ? 'bg-gray-50' : 'bg-white'
                    } ${isTodayDay ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      !isCurrentMonthDay ? 'text-gray-400' : isTodayDay ? 'text-blue-600 font-bold' : 'text-gray-900'
                    }`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <Link
                          key={event.id}
                          href={event.url || '#'}
                          className="block text-xs p-1 rounded truncate hover:opacity-80"
                          style={{ backgroundColor: event.color + '20', color: event.color }}
                          title={event.title}
                        >
                          <div className="flex items-center gap-1">
                            {getEventIcon(event.type)}
                            <span className="truncate">{event.title}</span>
                          </div>
                        </Link>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 px-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Selected Date Events Modal */}
        {selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  Events for {formatDate(selectedDate)}
                </h2>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No events for this date</p>
                ) : (
                  <div className="space-y-4">
                    {getEventsForDate(selectedDate).map(event => (
                      <Link
                        key={event.id}
                        href={event.url || '#'}
                        className="block p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="w-4 h-4 rounded-full mt-1"
                            style={{ backgroundColor: event.color }}
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{event.title}</h3>
                            {event.description && (
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            )}
                            {event.amount && (
                              <p className="text-sm font-medium text-gray-700 mt-1">
                                {formatCurrency(event.amount)}
                              </p>
                            )}
                            {event.familyName && (
                              <p className="text-xs text-gray-500 mt-1">Family: {event.familyName}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: event.color + '20', color: event.color }}>
                                {event.type.replace('_', ' ')}
                              </span>
                              {event.status && (
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                  {event.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold mb-4">Event Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#e91e63]" />
              <span className="text-sm">Weddings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#2196f3]" />
              <span className="text-sm">Bar Mitzvahs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#9c27b0]" />
              <span className="text-sm">Bat Mitzvahs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#4caf50]" />
              <span className="text-sm">Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#00bcd4]" />
              <span className="text-sm">Recurring Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#ff9800]" />
              <span className="text-sm">Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#757575]" />
              <span className="text-sm">Lifecycle Events</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

