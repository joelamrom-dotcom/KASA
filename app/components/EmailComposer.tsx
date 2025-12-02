'use client'

import { useState, useRef } from 'react'
import { PaperAirplaneIcon, PaperClipIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import dynamic from 'next/dynamic'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

interface EmailComposerProps {
  onSend?: (email: { to: string[], subject: string, body: string, attachments?: File[] }) => void
  onClose?: () => void
  initialTo?: string[]
  templateId?: string
}

export default function EmailComposer({ onSend, onClose, initialTo = [], templateId }: EmailComposerProps) {
  const [to, setTo] = useState<string[]>(initialTo)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [scheduledDate, setScheduledDate] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(templateId || '')
  const [templates, setTemplates] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (!to.length || !subject || !body) return
    
    onSend?.({
      to,
      subject,
      body,
      attachments
    })
  }

  const handleSchedule = () => {
    if (!scheduledDate) return
    // Schedule email logic
    console.log('Scheduling email for', scheduledDate)
  }

  const addAttachment = (files: FileList | null) => {
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">To</label>
        <input
          type="text"
          value={to.join(', ')}
          onChange={(e) => setTo(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="email1@example.com, email2@example.com"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Template</label>
        <select
          value={selectedTemplate}
          onChange={(e) => {
            setSelectedTemplate(e.target.value)
            // Load template content
          }}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">No template</option>
          {templates.map(t => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="Email subject"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Body</label>
        <ReactQuill
          theme="snow"
          value={body}
          onChange={setBody}
          className="bg-white"
          modules={{
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['link', 'image'],
              ['clean']
            ]
          }}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Attachments</label>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => addAttachment(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <PaperClipIcon className="h-5 w-5" />
            Add Attachment
          </button>
        </div>
        {attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
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
              onClick={handleSchedule}
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
          Send
        </button>
      </div>
    </div>
  )
}

