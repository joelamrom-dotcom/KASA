'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import TableImportExport from '@/app/components/TableImportExport'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline'

interface LifecycleEvent {
  _id: string
  familyId: string
  familyName: string
  eventType: string
  eventTypeLabel: string
  eventDate: string
  year: number
  amount: number
  notes: string
}

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

type ViewMode = 'table' | 'calendar'

function EventsPageContent() {
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<LifecycleEvent[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams?.get('view') === 'calendar' ? 'calendar' : 'table') as ViewMode
  )
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    if (viewMode === 'table') {
      fetchEvents()
    } else {
      fetchCalendarEvents()
    }
  }, [viewMode, currentDate])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/kasa/events')
      const data = await res.json()
      if (Array.isArray(data)) {
        setEvents(data)
      } else {
        console.error('API error:', data)
        setEvents([])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true)
      const start = getStartOfPeriod(currentDate, 'month')
      const end = getEndOfPeriod(currentDate, 'month')
      
      const token = localStorage.getItem('token')
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
      
      const res = await fetch(
        `/api/kasa/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`,
        { headers }
      )
      
      if (res.ok) {
        const data = await res.json()
        // Filter to only lifecycle events for this page
        const lifecycleEvents = (data.events || []).filter((e: CalendarEvent) => 
          e.type === 'lifecycle_event' || e.type === 'wedding' || e.type === 'bar_mitzvah' || e.type === 'bat_mitzvah'
        )
        setCalendarEvents(lifecycleEvents)
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      setCalendarEvents([])
    } finally {
      setLoading(false)
    }
  }

  const getStartOfPeriod = (date: Date, mode: string): Date => {
    const d = new Date(date)
    if (mode === 'month') {
      d.setDate(1)
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
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.start).toISOString().split('T')[0]
      return eventDate === dateStr
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

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth()
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'lifecycle_event':
      case 'wedding':
      case 'bar_mitzvah':
      case 'bat_mitzvah':
        return <CalendarIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const filteredEvents = filterType === 'all' 
    ? events 
    : events.filter(e => e.eventType === filterType)

  const eventTypeStats = {
    all: events.length,
    chasena: events.filter(e => e.eventType === 'chasena').length,
    bar_mitzvah: events.filter(e => e.eventType === 'bar_mitzvah').length,
    birth_boy: events.filter(e => e.eventType === 'birth_boy').length,
    birth_girl: events.filter(e => e.eventType === 'birth_girl').length,
  }

  const totalAmount = filteredEvents.reduce((sum, e) => sum + e.amount, 0)

  const days = getDaysInMonth(currentDate)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading events...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Events
            </h1>
            <p className="text-gray-600">
              {viewMode === 'table' 
                ? 'View and manage lifecycle events in a table format'
                : 'View lifecycle events on a calendar'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Table View"
              >
                <TableCellsIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Calendar View"
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
            </div>
            {viewMode === 'table' && (
              <TableImportExport
                data={filteredEvents}
                filename="lifecycle-events"
                headers={[
                  { key: 'familyName', label: 'Family Name' },
                  { key: 'eventTypeLabel', label: 'Event Type' },
                  { key: 'eventDate', label: 'Event Date' },
                  { key: 'year', label: 'Year' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'notes', label: 'Notes' }
                ]}
              />
            )}
          </div>
        </div>

        {/* Filter Tabs - Only show in table view */}
        {viewMode === 'table' && (
          <div className="mb-6 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 font-medium transition-colors ${
                filterType === 'all'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({eventTypeStats.all})
            </button>
            <button
              onClick={() => setFilterType('chasena')}
              className={`px-4 py-2 font-medium transition-colors ${
                filterType === 'chasena'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Chasena ({eventTypeStats.chasena})
            </button>
            <button
              onClick={() => setFilterType('bar_mitzvah')}
              className={`px-4 py-2 font-medium transition-colors ${
                filterType === 'bar_mitzvah'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bar/Bat Mitzvah ({eventTypeStats.bar_mitzvah})
            </button>
            <button
              onClick={() => setFilterType('birth_boy')}
              className={`px-4 py-2 font-medium transition-colors ${
                filterType === 'birth_boy'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Birth Boy ({eventTypeStats.birth_boy})
            </button>
            <button
              onClick={() => setFilterType('birth_girl')}
              className={`px-4 py-2 font-medium transition-colors ${
                filterType === 'birth_girl'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Birth Girl ({eventTypeStats.birth_girl})
            </button>
          </div>
        )}

        {/* Calendar Navigation - Only show in calendar view */}
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateMonth('prev')}
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
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="text-lg font-semibold">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <>
            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No events found.
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Family Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Year
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEvents.map((event) => (
                        <tr key={event._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {event.familyId ? (
                              <Link
                                href={`/families/${event.familyId}`}
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                              >
                                {event.familyName}
                              </Link>
                            ) : (
                              <span className="font-medium text-gray-900">{event.familyName}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              event.eventType === 'chasena' ? 'bg-purple-100 text-purple-800' :
                              event.eventType === 'bar_mitzvah' ? 'bg-blue-100 text-blue-800' :
                              event.eventType === 'birth_boy' ? 'bg-green-100 text-green-800' :
                              'bg-pink-100 text-pink-800'
                            }`}>
                              {event.eventTypeLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(event.eventDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {event.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${event.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {event.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-6 py-3 text-sm font-medium text-gray-900">
                          Total ({filteredEvents.length} events):
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-gray-900">
                          ${totalAmount.toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
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
                    onClick={() => setSelectedDate(day)}
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
        {selectedDate && viewMode === 'calendar' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedDate(null)}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  Events on {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-gray-500">No events on this date</p>
                ) : (
                  getEventsForDate(selectedDate).map(event => (
                    <Link
                      key={event.id}
                      href={event.url || '#'}
                      className="block p-3 rounded-lg border hover:bg-gray-50"
                      style={{ borderLeftColor: event.color, borderLeftWidth: '4px' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          )}
                          {event.amount && (
                            <p className="text-sm text-gray-500 mt-1">${event.amount.toLocaleString()}</p>
                          )}
                        </div>
                        <div className="ml-4" style={{ color: event.color }}>
                          {getEventIcon(event.type)}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading events...</div>
        </div>
      </div>
    }>
      <EventsPageContent />
    </Suspense>
  )
}
