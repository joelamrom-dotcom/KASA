'use client'

import { useState, useEffect } from 'react'
import { EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

export default function InboxPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'email' | 'sms'>('all')

  useEffect(() => {
    fetchMessages()
  }, [filter])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      let url = '/api/kasa/communication/inbox?'
      if (filter !== 'all') url += `type=${filter}&`

      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Communication Inbox
        </h1>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('email')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${filter === 'email' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              <EnvelopeIcon className="h-5 w-5" />
              Email
            </button>
            <button
              onClick={() => setFilter('sms')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${filter === 'sms' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              SMS
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No messages found</div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{message.familyId?.name || 'Unknown Family'}</p>
                      <p className="text-sm text-gray-600">{message.subject || message.body?.substring(0, 100)}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(message.sentAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      message.type === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {message.type?.toUpperCase()}
                    </span>
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

