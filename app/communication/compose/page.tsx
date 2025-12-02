'use client'

import { useState } from 'react'
import { EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import EmailComposer from '@/app/components/EmailComposer'
import SMSComposer from '@/app/components/SMSComposer'

export default function ComposePage() {
  const [composeType, setComposeType] = useState<'email' | 'sms'>('email')

  const handleEmailSend = async (email: any) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          type: 'email',
          recipients: email.to,
          subject: email.subject,
          body: email.body,
          attachments: email.attachments
        })
      })
      if (res.ok) {
        alert('Email sent successfully!')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to send email')
    }
  }

  const handleSMSSend = async (sms: any) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          type: 'sms',
          recipients: sms.to,
          body: sms.message
        })
      })
      if (res.ok) {
        alert('SMS sent successfully!')
      }
    } catch (error) {
      console.error('Error sending SMS:', error)
      alert('Failed to send SMS')
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Compose Message
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setComposeType('email')}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                composeType === 'email' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              <EnvelopeIcon className="h-6 w-6" />
              Email
            </button>
            <button
              onClick={() => setComposeType('sms')}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                composeType === 'sms' ? 'bg-green-600 text-white' : 'bg-gray-100'
              }`}
            >
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
              SMS
            </button>
          </div>
        </div>

        {composeType === 'email' ? (
          <EmailComposer onSend={handleEmailSend} />
        ) : (
          <SMSComposer onSend={handleSMSSend} />
        )}
      </div>
    </div>
  )
}

