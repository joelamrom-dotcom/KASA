'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon } from '@heroicons/react/24/outline'

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchEvents()
  }, [currentDate])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString()
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString()

      const res = await fetch(`/api/kasa/calendar/events?start=${start}&end=${end}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
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

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Calendar
        </h1>

        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <div className="text-center py-8">Loading calendar...</div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(event.start).toLocaleDateString()} at {new Date(event.start).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="text-center py-8 text-gray-500">No events found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
