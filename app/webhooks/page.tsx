'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, KeyIcon } from '@heroicons/react/24/outline'

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    url: '',
    events: [] as string[],
    secret: ''
  })

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/webhooks', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setWebhooks(data.webhooks || [])
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setShowModal(false)
        setFormData({ url: '', events: [], secret: '' })
        fetchWebhooks()
      }
    } catch (error) {
      console.error('Error creating webhook:', error)
    }
  }

  if (loading) {
    return <div className="min-h-screen p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Webhooks & API
            </h1>
            <p className="text-gray-600">Configure webhooks for external integrations</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-xl"
          >
            <PlusIcon className="h-5 w-5" />
            New Webhook
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <KeyIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">API Keys</h2>
          </div>
          <p className="text-gray-600 mb-4">API key management coming soon...</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Webhooks</h2>
          {webhooks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No webhooks configured</p>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{webhook.url}</p>
                      <p className="text-sm text-gray-600">{webhook.events?.join(', ') || 'No events'}</p>
                    </div>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Webhook Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold">Create Webhook</h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setFormData({ url: '', events: [], secret: '' })
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Webhook URL *</label>
                  <input
                    type="url"
                    required
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="https://example.com/webhook"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Events *</label>
                  <div className="space-y-2">
                    {['payment.created', 'payment.updated', 'family.created', 'member.created'].map((event) => (
                      <label key={event} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.events.includes(event)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, events: [...formData.events, event] })
                            } else {
                              setFormData({ ...formData, events: formData.events.filter(e => e !== event) })
                            }
                          }}
                        />
                        <span className="text-sm">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Secret (optional)</label>
                  <input
                    type="text"
                    value={formData.secret}
                    onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Webhook secret for verification"
                  />
                </div>
                <div className="flex gap-4 justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setFormData({ url: '', events: [], secret: '' })
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Webhook
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

