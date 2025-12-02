'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import Modal from '@/app/components/Modal'

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [entityType, setEntityType] = useState<'family' | 'member' | 'payment'>('family')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newField, setNewField] = useState({
    name: '',
    fieldType: 'text' as 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'email' | 'phone',
    options: [] as string[],
    required: false,
    defaultValue: ''
  })

  useEffect(() => {
    fetchFields()
  }, [entityType])

  const fetchFields = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/custom-fields?entityType=${entityType}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setFields(data.fields || [])
      }
    } catch (error) {
      console.error('Error fetching fields:', error)
    } finally {
      setLoading(false)
    }
  }

  const createField = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/custom-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...newField,
          entityType
        })
      })
      if (res.ok) {
        setShowCreateModal(false)
        setNewField({ name: '', fieldType: 'text', options: [], required: false, defaultValue: '' })
        fetchFields()
      }
    } catch (error) {
      console.error('Error creating field:', error)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Custom Fields
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Field
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex gap-4 mb-6">
            {['family', 'member', 'payment'].map((type) => (
              <button
                key={type}
                onClick={() => setEntityType(type as any)}
                className={`px-4 py-2 rounded-lg capitalize ${
                  entityType === type ? 'bg-blue-600 text-white' : 'bg-gray-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : fields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No custom fields defined</div>
          ) : (
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{field.name}</p>
                    <p className="text-sm text-gray-500">{field.fieldType}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Create Custom Field</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Field Name</label>
                <input
                  type="text"
                  value={newField.name}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Custom Notes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Field Type</label>
                <select
                  value={newField.fieldType}
                  onChange={(e) => setNewField({ ...newField, fieldType: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Select (Dropdown)</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="textarea">Textarea</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              {newField.fieldType === 'select' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Options (one per line)</label>
                  <textarea
                    value={newField.options.join('\n')}
                    onChange={(e) => setNewField({ ...newField, options: e.target.value.split('\n').filter(s => s.trim()) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={4}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                </div>
              )}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  />
                  <span className="text-sm">Required field</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Default Value (optional)</label>
                <input
                  type="text"
                  value={newField.defaultValue}
                  onChange={(e) => setNewField({ ...newField, defaultValue: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={createField}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Field
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

