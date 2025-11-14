'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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

export default function EventsPage() {
  const [events, setEvents] = useState<LifecycleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
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
              All Lifecycle Events
            </h1>
            <p className="text-gray-600">View and manage all lifecycle events</p>
          </div>
        </div>

        {/* Filter Tabs */}
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

        {/* Events Table */}
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
      </div>
    </div>
  )
}

