'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, PlusIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import Modal from '@/app/components/Modal'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    isRecurring: false,
    recurrencePattern: 'none' as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly',
    reminder: false,
    reminderMinutes: 15
  })

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

  const createEvent = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newEvent)
      })
      if (res.ok) {
        setShowCreateModal(false)
        fetchEvents()
      }
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setNewEvent({
      ...newEvent,
      startDate: date.toISOString().split('T')[0],
      endDate: date.toISOString().split('T')[0]
    })
    setShowCreateModal(true)
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Calendar
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Event
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <Calendar
                onChange={(value) => value && setCurrentDate(value as Date)}
                value={currentDate}
                onClickDay={handleDateClick}
                tileContent={({ date }) => {
                  const dayEvents = events.filter(e => {
                    const eventDate = new Date(e.start)
                    return eventDate.toDateString() === date.toDateString()
                  })
                  return dayEvents.length > 0 ? (
                    <div className="flex gap-1 justify-center mt-1">
                      {dayEvents.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-blue-600 rounded-full"></div>
                      ))}
                    </div>
                  ) : null
                }}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold mb-4">Upcoming Events</h2>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : events.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No events</p>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 10).map((event) => (
                    <div key={event._id} className="border rounded-lg p-3">
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.start).toLocaleDateString()} {new Date(event.start).toLocaleTimeString()}
                      </p>
                      {event.isRecurring && (
                        <div className="flex items-center gap-1 mt-1">
                          <ArrowPathIcon className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{event.recurrencePattern}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Create Event</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newEvent.isRecurring}
                    onChange={(e) => setNewEvent({ ...newEvent, isRecurring: e.target.checked })}
                  />
                  <span className="text-sm font-medium">Recurring Event</span>
                </label>
                {newEvent.isRecurring && (
                  <select
                    value={newEvent.recurrencePattern}
                    onChange={(e) => setNewEvent({ ...newEvent, recurrencePattern: e.target.value as any })}
                    className="w-full mt-2 px-3 py-2 border rounded-lg"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newEvent.reminder}
                    onChange={(e) => setNewEvent({ ...newEvent, reminder: e.target.checked })}
                  />
                  <span className="text-sm font-medium">Set Reminder</span>
                </label>
                {newEvent.reminder && (
                  <input
                    type="number"
                    value={newEvent.reminderMinutes}
                    onChange={(e) => setNewEvent({ ...newEvent, reminderMinutes: parseInt(e.target.value) || 15 })}
                    className="w-full mt-2 px-3 py-2 border rounded-lg"
                    placeholder="Minutes before"
                  />
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={createEvent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

