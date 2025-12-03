'use client'

import { useState, useEffect } from 'react'
import { LinkIcon, KeyIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([
    { id: 'quickbooks', name: 'QuickBooks', status: 'connected', icon: '📊' },
    { id: 'stripe', name: 'Stripe', status: 'connected', icon: '💳' },
    { id: 'mailchimp', name: 'Mailchimp', status: 'available', icon: '📧' },
    { id: 'zapier', name: 'Zapier', status: 'available', icon: '⚡' }
  ])
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'integrations' | 'webhooks' | 'api-keys'>('integrations')

  useEffect(() => {
    fetchWebhooks()
    fetchApiKeys()
  }, [])

  const fetchWebhooks = async () => {
    try {
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
    }
  }

  const fetchApiKeys = async () => {
    // Would fetch from API
    setApiKeys([])
  }

  const connectIntegration = async (id: string) => {
    // Integration connection logic
    console.log('Connecting', id)
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Integrations & API
        </h1>

        <div className="bg-white rounded-lg shadow">
          <div className="flex gap-4 p-4 border-b">
            <button
              onClick={() => setActiveTab('integrations')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'integrations' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Integrations
            </button>
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'webhooks' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Webhooks
            </button>
            <button
              onClick={() => setActiveTab('api-keys')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'api-keys' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              API Keys
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'integrations' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{integration.icon}</span>
                        <div>
                          <h3 className="font-semibold">{integration.name}</h3>
                          <p className="text-sm text-gray-500">
                            {integration.status === 'connected' ? 'Connected' : 'Available'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {integration.status === 'connected' ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        ) : (
                          <button
                            onClick={() => connectIntegration(integration.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'webhooks' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Webhooks</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Create Webhook
                  </button>
                </div>
                {webhooks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No webhooks configured</div>
                ) : (
                  <div className="space-y-3">
                    {webhooks.map((webhook) => (
                      <div key={webhook._id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{webhook.url}</h3>
                            <p className="text-sm text-gray-500">{webhook.events?.join(', ')}</p>
                          </div>
                          <span className={`px-3 py-1 rounded text-sm ${
                            webhook.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {webhook.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'api-keys' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">API Keys</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Generate Key
                  </button>
                </div>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No API keys generated</div>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div key={key._id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{key.name}</h3>
                            <p className="text-sm text-gray-500 font-mono">{key.key?.substring(0, 20)}...</p>
                          </div>
                          <button className="px-3 py-1 text-red-600 hover:bg-red-50 rounded">
                            Revoke
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

