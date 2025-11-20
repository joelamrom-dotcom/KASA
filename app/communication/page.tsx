'use client'

import { useState, useEffect } from 'react'
import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { getUser } from '@/lib/auth'

interface Family {
  _id: string
  name: string
  email?: string
  husbandCellPhone?: string
  wifeCellPhone?: string
  receiveEmails?: boolean
  receiveSMS?: boolean
}

interface MessageTemplate {
  _id: string
  name: string
  subject: string
  body: string
  type: 'email' | 'sms'
}

interface MessageHistory {
  _id: string
  subject: string
  body: string
  type: 'email' | 'sms'
  recipients: string[]
  sentAt: string
  status: 'sent' | 'failed'
  successCount: number
  failureCount: number
}

export default function CommunicationPage() {
  const [families, setFamilies] = useState<Family[]>([])
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([])
  const [messageType, setMessageType] = useState<'email' | 'sms'>('email')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [history, setHistory] = useState<MessageHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    body: '',
    type: 'email' as 'email' | 'sms'
  })

  useEffect(() => {
    fetchFamilies()
    fetchTemplates()
    fetchHistory()
  }, [])

  const fetchFamilies = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/kasa/families', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (response.ok) {
        const data = await response.json()
        setFamilies(data || [])
      }
    } catch (error) {
      console.error('Error fetching families:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/kasa/message-templates', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/kasa/messages/history', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (response.ok) {
        const data = await response.json()
        setHistory(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  const handleSelectAll = () => {
    if (selectedFamilies.length === families.length) {
      setSelectedFamilies([])
    } else {
      setSelectedFamilies(families.map(f => f._id))
    }
  }

  const handleSelectFamily = (familyId: string) => {
    setSelectedFamilies(prev =>
      prev.includes(familyId)
        ? prev.filter(id => id !== familyId)
        : [...prev, familyId]
    )
  }

  const handleUseTemplate = (template: MessageTemplate) => {
    setSubject(template.subject)
    setBody(template.body)
    setMessageType(template.type)
    setShowTemplateModal(false)
  }

  const handleSend = async () => {
    if (selectedFamilies.length === 0) {
      alert('Please select at least one family')
      return
    }

    if (messageType === 'email' && !subject) {
      alert('Please enter a subject')
      return
    }

    if (!body.trim()) {
      alert('Please enter a message')
      return
    }

    setSending(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/kasa/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          familyIds: selectedFamilies,
          type: messageType,
          subject: messageType === 'email' ? subject : undefined,
          body
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Message sent! ${data.successCount} successful, ${data.failureCount} failed`)
        setSubject('')
        setBody('')
        setSelectedFamilies([])
        fetchHistory()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to send message'}`)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.body) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/kasa/message-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(templateForm)
      })

      if (response.ok) {
        alert('Template saved successfully!')
        setShowTemplateModal(false)
        setTemplateForm({ name: '', subject: '', body: '', type: 'email' })
        fetchTemplates()
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template')
    }
  }

  const eligibleFamilies = families.filter(f => {
    if (messageType === 'email') {
      return f.email && f.receiveEmails !== false
    } else {
      return (f.husbandCellPhone || f.wifeCellPhone) && f.receiveSMS !== false
    }
  })

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Communication Center
          </h1>
          <p className="text-gray-600">Send bulk messages to families</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message Composition */}
          <div className="lg:col-span-2 space-y-6">
            {/* Message Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <label className="block text-sm font-medium mb-3">Message Type</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setMessageType('email')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    messageType === 'email'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <EnvelopeIcon className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Email</span>
                </button>
                <button
                  onClick={() => setMessageType('sms')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    messageType === 'sms'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">SMS</span>
                </button>
              </div>
            </div>

            {/* Templates */}
            {templates.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Templates</h3>
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + New Template
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {templates.filter(t => t.type === messageType).map(template => (
                    <button
                      key={template._id}
                      onClick={() => handleUseTemplate(template)}
                      className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{template.subject || template.body}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Form */}
            <div className="bg-white rounded-lg shadow p-6">
              {messageType === 'email' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Subject *</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Message subject"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Message *</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder={messageType === 'email' ? 'Email message...' : 'SMS message (160 characters max)...'}
                  maxLength={messageType === 'sms' ? 160 : undefined}
                />
                {messageType === 'sms' && (
                  <p className="text-xs text-gray-500 mt-1">{body.length}/160 characters</p>
                )}
              </div>
            </div>

            {/* Recipients */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recipients ({selectedFamilies.length} selected)</h3>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {selectedFamilies.length === eligibleFamilies.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {eligibleFamilies.map(family => (
                  <label
                    key={family._id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFamilies.includes(family._id)}
                      onChange={() => handleSelectFamily(family._id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{family.name}</p>
                      <p className="text-xs text-gray-500">
                        {messageType === 'email' ? family.email : (family.husbandCellPhone || family.wifeCellPhone)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={sending || selectedFamilies.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              {sending ? 'Sending...' : `Send ${messageType.toUpperCase()} to ${selectedFamilies.length} ${selectedFamilies.length === 1 ? 'family' : 'families'}`}
            </button>
          </div>

          {/* Message History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Recent Messages</h3>
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500">No messages sent yet</p>
              ) : (
                history.slice(0, 10).map(msg => (
                  <div key={msg._id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        msg.type === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {msg.type.toUpperCase()}
                      </span>
                      {msg.status === 'sent' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm font-medium mb-1">{msg.subject || 'No subject'}</p>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{msg.body}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{msg.recipients.length} recipients</span>
                      <span>{new Date(msg.sentAt).toLocaleDateString()}</span>
                    </div>
                    {msg.status === 'sent' && (
                      <div className="mt-2 text-xs">
                        <span className="text-green-600">{msg.successCount} sent</span>
                        {msg.failureCount > 0 && (
                          <span className="text-red-600 ml-2">{msg.failureCount} failed</span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold">Save Template</h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Template Name *</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={templateForm.type}
                    onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as 'email' | 'sms' })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                {templateForm.type === 'email' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject</label>
                    <input
                      type="text"
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Body *</label>
                  <textarea
                    value={templateForm.body}
                    onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                    rows={6}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="flex gap-4 justify-end pt-4">
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

