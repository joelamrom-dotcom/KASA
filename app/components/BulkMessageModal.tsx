'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'
import FormField from './FormField'
import { showToast } from './Toast'

interface BulkMessageModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  messageType: 'email' | 'sms'
  onSend: (subject: string, message: string) => Promise<void>
}

export default function BulkMessageModal({
  isOpen,
  onClose,
  selectedCount,
  messageType,
  onSend,
}: BulkMessageModalProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSubject('')
      setMessage('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) {
      showToast('Please enter a message', 'warning')
      return
    }

    if (messageType === 'email' && !subject.trim()) {
      showToast('Please enter a subject', 'warning')
      return
    }

    setLoading(true)
    try {
      await onSend(subject, message)
      showToast(
        `Successfully sent ${messageType.toUpperCase()} to ${selectedCount} recipient${selectedCount !== 1 ? 's' : ''}`,
        'success'
      )
      onClose()
      setSubject('')
      setMessage('')
    } catch (error: any) {
      showToast(error.message || `Failed to send ${messageType.toUpperCase()}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const messagePlaceholder = messageType === 'email' 
    ? 'Enter your email message here...'
    : 'Enter your SMS message here (160 characters recommended)...'

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Send Bulk ${messageType.toUpperCase()} to ${selectedCount} ${selectedCount === 1 ? 'Recipient' : 'Recipients'}`} 
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {messageType === 'email' && (
          <FormField
            label="Subject"
            name="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            required
          />
        )}

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message {messageType === 'sms' && <span className="text-gray-500">({message.length} characters)</span>}
          </label>
          <textarea
            id="message"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={messagePlaceholder}
            required
            rows={messageType === 'sms' ? 4 : 8}
            maxLength={messageType === 'sms' ? 160 : undefined}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          {messageType === 'sms' && (
            <p className="mt-1 text-sm text-gray-500">
              SMS messages are limited to 160 characters. Longer messages may be split into multiple parts.
            </p>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> This will send {messageType.toUpperCase()} to {selectedCount} selected {selectedCount === 1 ? 'recipient' : 'recipients'}.
            {messageType === 'email' && ' Make sure all recipients have opted in to receive emails.'}
            {messageType === 'sms' && ' Make sure all recipients have opted in to receive SMS messages.'}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !message.trim() || (messageType === 'email' && !subject.trim())}
          >
            {loading ? 'Sending...' : `Send ${messageType.toUpperCase()}`}
          </button>
        </div>
      </form>
    </Modal>
  )
}

