'use client'

import { useState } from 'react'
import { PaperAirplaneIcon, ClockIcon } from '@heroicons/react/24/outline'

interface SMSComposerProps {
  onSend?: (sms: { to: string[], message: string }) => void
  onClose?: () => void
  initialTo?: string[]
}

export default function SMSComposer({ onSend, onClose, initialTo = [] }: SMSComposerProps) {
  const [to, setTo] = useState<string[]>(initialTo)
  const [message, setMessage] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const maxLength = 160
  const characterCount = message.length
  const messageCount = Math.ceil(characterCount / maxLength)

  const handleSend = () => {
    if (!to.length || !message.trim()) return
    
    onSend?.({
      to,
      message
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">To (Phone Numbers)</label>
        <input
          type="text"
          value={to.join(', ')}
          onChange={(e) => setTo(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="+1234567890, +0987654321"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Message
          <span className={`ml-2 text-sm ${
            characterCount > maxLength * 3 ? 'text-red-600' :
            characterCount > maxLength ? 'text-yellow-600' :
            'text-gray-500'
          }`}>
            ({characterCount} / {maxLength * 3} characters, {messageCount} message{messageCount !== 1 ? 's' : ''})
          </span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          rows={6}
          maxLength={maxLength * 3}
          placeholder="Type your SMS message here..."
        />
        <div className="mt-1 text-xs text-gray-500">
          Standard SMS: 160 characters. Long SMS: up to {maxLength * 3} characters ({messageCount} messages)
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Schedule Send (optional)</label>
        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          {scheduledDate && (
            <button
              onClick={() => console.log('Schedule SMS for', scheduledDate)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <ClockIcon className="h-5 w-5" />
              Schedule
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSend}
          disabled={!to.length || !message.trim()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
          Send SMS
        </button>
      </div>
    </div>
  )
}

