'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface LifecycleEventType {
  _id: string
  type: string
  name: string
  amount: number
}

export default function LifecycleEventTypesPage() {
  const [eventTypes, setEventTypes] = useState<LifecycleEventType[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEventType, setEditingEventType] = useState<LifecycleEventType | null>(null)
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    amount: ''
  })

  useEffect(() => {
    fetchEventTypes()
  }, [])

  const fetchEventTypes = async () => {
    try {
      const res = await fetch('/api/kasa/lifecycle-event-types')
      const data = await res.json()
      if (Array.isArray(data)) {
        // Sort by name for better display
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name))
        setEventTypes(sorted)
      } else {
        console.error('API error:', data)
        setEventTypes([])
      }
    } catch (error) {
      console.error('Error fetching event types:', error)
      setEventTypes([])
    } finally {
      setLoading(false)
    }
  }

  const initializeDefaults = async () => {
    if (!confirm('This will create default event types if they don\'t exist. Continue?')) {
      return
    }

    try {
      const res = await fetch('/api/kasa/lifecycle-event-types/initialize', {
        method: 'POST'
      })

      if (res.ok) {
        alert('Default event types initialized successfully!')
        fetchEventTypes()
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to initialize defaults'}`)
      }
    } catch (error) {
      console.error('Error initializing defaults:', error)
      alert('Failed to initialize default event types')
    }
  }

  const resetForm = () => {
    setFormData({
      type: '',
      name: '',
      amount: ''
    })
    setEditingEventType(null)
  }

  const handleEdit = (eventType: LifecycleEventType) => {
    setEditingEventType(eventType)
    setFormData({
      type: eventType.type,
      name: eventType.name,
      amount: eventType.amount.toString()
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event type?')) {
      return
    }

    try {
      const res = await fetch(`/api/kasa/lifecycle-event-types/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchEventTypes()
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to delete event type'}`)
      }
    } catch (error) {
      console.error('Error deleting event type:', error)
      alert('Failed to delete event type')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingEventType
        ? `/api/kasa/lifecycle-event-types/${editingEventType._id}`
        : '/api/kasa/lifecycle-event-types'
      
      const method = editingEventType ? 'PUT' : 'POST'
      
      const body = editingEventType
        ? { name: formData.name, amount: formData.amount }
        : { type: formData.type, name: formData.name, amount: formData.amount }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setShowModal(false)
        resetForm()
        fetchEventTypes()
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Failed to save event type'}`)
      }
    } catch (error) {
      console.error('Error saving event type:', error)
      alert('Failed to save event type')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading event types...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Lifecycle Event Types</h1>
          <div className="flex gap-3">
            {eventTypes.length === 0 && (
              <button
                onClick={initializeDefaults}
                className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
              >
                Initialize Defaults
              </button>
            )}
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5" />
              Add Event Type
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {eventTypes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No event types found. Click "Initialize Defaults" to create default event types (Bar Mitzvah, Chasena/Wedding, Birth Boy, Birth Girl) or "Add Event Type" to create a custom one.
                  </td>
                </tr>
              ) : (
                eventTypes.map((eventType) => (
                  <tr key={eventType._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {eventType.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      ${eventType.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(eventType)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit Event Type"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(eventType._id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete Event Type"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {eventTypes.length > 0 && (
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    Total ({eventTypes.length} event types):
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-gray-900">
                    ${eventTypes.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">
                {editingEventType ? 'Edit' : 'Add'} Event Type
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingEventType && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Type Code</label>
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., chasena, bar_mitzvah"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Unique identifier (lowercase, use underscores)
                    </p>
                  </div>
                )}
                {editingEventType && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Type Code</label>
                    <input
                      type="text"
                      value={formData.type}
                      className="w-full border rounded px-3 py-2 bg-gray-100"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Type code cannot be changed after creation
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., Chasena, Bar Mitzvah"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingEventType ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

