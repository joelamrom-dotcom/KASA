'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [entityType, setEntityType] = useState<'family' | 'member' | 'payment'>('family')

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

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Custom Fields
          </h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
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
      </div>
    </div>
  )
}

