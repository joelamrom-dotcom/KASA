'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, TagIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { getUser } from '@/lib/auth'

interface FamilyTag {
  _id?: string
  name: string
  color: string
  description?: string
}

export default function FamilyTagsPage() {
  const [tags, setTags] = useState<FamilyTag[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTag, setEditingTag] = useState<FamilyTag | null>(null)
  const [formData, setFormData] = useState<FamilyTag>({
    name: '',
    color: '#3b82f6',
    description: ''
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/family-tags', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setTags(data)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/family-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...formData, _id: editingTag?._id })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: editingTag ? 'Tag updated successfully!' : 'Tag created successfully!' })
        setShowModal(false)
        setEditingTag(null)
        setFormData({ name: '', color: '#3b82f6', description: '' })
        fetchTags()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save tag' })
      }
    } catch (error) {
      console.error('Error saving tag:', error)
      setMessage({ type: 'error', text: 'Failed to save tag' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag? Families using this tag will have it removed.')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/family-tags?id=${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Tag deleted successfully!' })
        fetchTags()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to delete tag' })
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
      setMessage({ type: 'error', text: 'Failed to delete tag' })
    }
  }

  const handleEdit = (tag: FamilyTag) => {
    setEditingTag(tag)
    setFormData(tag)
    setShowModal(true)
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Family Tags
          </h1>
          <p className="text-gray-600">Organize families with custom tags</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Tags</h2>
            <button
              onClick={() => {
                setEditingTag(null)
                setFormData({ name: '', color: '#3b82f6', description: '' })
                setShowModal(true)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              New Tag
            </button>
          </div>

          {tags.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <TagIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No tags found. Create your first tag to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map((tag) => (
                <div
                  key={tag._id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  style={{ borderLeftColor: tag.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <h3 className="font-semibold text-gray-800">{tag.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(tag)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag._id!)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {tag.description && (
                    <p className="text-sm text-gray-600 mt-2">{tag.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold">{editingTag ? 'Edit Tag' : 'Create New Tag'}</h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingTag(null)
                    setFormData({ name: '', color: '#3b82f6', description: '' })
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., VIP, New Family, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Optional description..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingTag(null)
                      setFormData({ name: '', color: '#3b82f6', description: '' })
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingTag ? 'Update Tag' : 'Create Tag'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

