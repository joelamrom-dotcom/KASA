'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'
import { getAvailableVariables, previewTemplate, replaceTemplateVariables } from '@/lib/template-engine'

interface Template {
  _id: string
  name: string
  subject?: string
  body: string
  bodyHtml?: string
  type: 'email' | 'sms'
  isHtml: boolean
  variables: Array<{
    name: string
    displayName: string
    category: string
  }>
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [previewContent, setPreviewContent] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    bodyHtml: '',
    type: 'email' as 'email' | 'sms',
    isHtml: false
  })
  const [availableVars, setAvailableVars] = useState<any[]>([])

  useEffect(() => {
    fetchTemplates()
    setAvailableVars(getAvailableVariables('family'))
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/message-templates', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/templates/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          template: formData.bodyHtml || formData.body,
          category: 'family'
        })
      })
      if (res.ok) {
        const data = await res.json()
        setPreviewContent(data.preview)
        setShowPreview(true)
      }
    } catch (error) {
      console.error('Error previewing template:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const url = editingTemplate
        ? `/api/kasa/message-templates/${editingTemplate._id}`
        : '/api/kasa/message-templates'
      const method = editingTemplate ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setShowModal(false)
        setEditingTemplate(null)
        resetForm()
        fetchTemplates()
      }
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/message-templates/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        fetchTemplates()
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      body: '',
      bodyHtml: '',
      type: 'email',
      isHtml: false
    })
  }

  const insertVariable = (varName: string) => {
    const currentBody = formData.bodyHtml || formData.body
    const newBody = currentBody + ` {{${varName}}}`
    if (formData.isHtml) {
      setFormData({ ...formData, bodyHtml: newBody })
    } else {
      setFormData({ ...formData, body: newBody })
    }
  }

  if (loading) {
    return <div className="min-h-screen p-8">Loading...</div>
  }

  return <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Email/SMS Templates
            </h1>
            <p className="text-gray-600">Create and manage customizable message templates</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setEditingTemplate(null)
              setShowModal(true)
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-xl transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            New Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs rounded ${
                    template.type === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {template.type.toUpperCase()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFormData({
                        name: template.name,
                        subject: template.subject || '',
                        body: template.body,
                        bodyHtml: template.bodyHtml || template.body,
                        type: template.type,
                        isHtml: template.isHtml
                      })
                      setEditingTemplate(template)
                      setShowModal(true)
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(template._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{template.subject || template.body.substring(0, 100)}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <span>{template.variables?.length || 0} variables</span>
              </div>
            </div>
          ))}
        </div>

        {/* Template Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {editingTemplate ? 'Edit' : 'Create'} Template
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingTemplate(null)
                    resetForm()
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Template Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'email' | 'sms' })}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                </div>

                {formData.type === 'email' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="e.g., Payment Reminder for {{familyName}}"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Body *</label>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.isHtml}
                          onChange={(e) => setFormData({ ...formData, isHtml: e.target.checked })}
                        />
                        HTML
                      </label>
                      <button
                        type="button"
                        onClick={handlePreview}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                  <textarea
                    required
                    value={formData.isHtml ? formData.bodyHtml : formData.body}
                    onChange={(e) => {
                      if (formData.isHtml) {
                        setFormData({ ...formData, bodyHtml: e.target.value })
                      } else {
                        setFormData({ ...formData, body: e.target.value })
                      }
                    }}
                    rows={10}
                    className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                    placeholder="Enter template body. Use {{variableName}} for variables."
                  />
                </div>

                {/* Available Variables */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">Available Variables (click to insert)</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableVars.map((v) => (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => insertVariable(v.name)}
                        className="px-3 py-1 bg-white border rounded text-xs hover:bg-blue-50 hover:border-blue-300"
                        title={v.description}
                      >
                        {v.displayName} ({{{v.name}}})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingTemplate(null)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingTemplate ? 'Update' : 'Create'} Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold">Template Preview</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <div className="p-6">
                {formData.isHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: previewContent }} />
                ) : (
                  <pre className="whitespace-pre-wrap">{previewContent}</pre>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
}

