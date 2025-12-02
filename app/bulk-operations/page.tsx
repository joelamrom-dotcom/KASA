'use client'

import { useState } from 'react'
import { ArrowPathIcon, EnvelopeIcon, CreditCardIcon, TagIcon } from '@heroicons/react/24/outline'

export default function BulkOperationsPage() {
  const [activeOperation, setActiveOperation] = useState<'payment_plans' | 'messaging' | 'status' | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleBulkOperation = async (operation: string, data: any) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/bulk/operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ operation, ...data })
      })

      if (res.ok) {
        const result = await res.json()
        setResults(result)
        alert(`Operation completed: ${JSON.stringify(result)}`)
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error executing bulk operation:', error)
      alert('Failed to execute operation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Bulk Operations
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bulk Payment Plan Updates */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCardIcon className="h-8 w-8 text-blue-600" />
              <h2 className="text-xl font-semibold">Update Payment Plans</h2>
            </div>
            <p className="text-gray-600 mb-4">Bulk update payment plans based on filters</p>
            <button
              onClick={() => setActiveOperation('payment_plans')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Configure
            </button>
          </div>

          {/* Bulk Messaging */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <EnvelopeIcon className="h-8 w-8 text-green-600" />
              <h2 className="text-xl font-semibold">Bulk Messaging</h2>
            </div>
            <p className="text-gray-600 mb-4">Send messages to multiple families</p>
            <button
              onClick={() => setActiveOperation('messaging')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Configure
            </button>
          </div>

          {/* Bulk Status Updates */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <TagIcon className="h-8 w-8 text-purple-600" />
              <h2 className="text-xl font-semibold">Update Status</h2>
            </div>
            <p className="text-gray-600 mb-4">Bulk update family status and preferences</p>
            <button
              onClick={() => setActiveOperation('status')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Configure
            </button>
          </div>
        </div>

        {/* Operation Forms */}
        {activeOperation && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">
              {activeOperation === 'payment_plans' && 'Update Payment Plans'}
              {activeOperation === 'messaging' && 'Bulk Messaging'}
              {activeOperation === 'status' && 'Update Status'}
            </h3>
            {/* Forms would go here - simplified for now */}
            <div className="space-y-4">
              <p className="text-gray-600">Configure your bulk operation filters and settings...</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveOperation(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBulkOperation(`update_${activeOperation}`, {})}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Execute'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

