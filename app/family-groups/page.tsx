'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { getUser } from '@/lib/auth'

interface FamilyGroup {
  _id?: string
  name: string
  description?: string
  color: string
  families?: Array<{ _id: string; name: string }>
}

interface Family {
  _id: string
  name: string
}

export default function FamilyGroupsPage() {
  const [groups, setGroups] = useState<FamilyGroup[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<FamilyGroup | null>(null)
  const [formData, setFormData] = useState<FamilyGroup>({
    name: '',
    color: '#3b82f6',
    description: '',
    families: []
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchGroups()
    fetchFamilies()
  }, [])

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/family-groups', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFamilies = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/families', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setFamilies(data)
      }
    } catch (error) {
      console.error('Error fetching families:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/family-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...formData,
          _id: editingGroup?._id,
          families: formData.families?.map(f => f._id) || []
        })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: editingGroup ? 'Group updated successfully!' : 'Group created successfully!' })
        setShowModal(false)
        setEditingGroup(null)
        setFormData({ name: '', color: '#3b82f6', description: '', families: [] })
        fetchGroups()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save group' })
      }
    } catch (error) {
      console.error('Error saving group:', error)
      setMessage({ type: 'error', text: 'Failed to save group' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group? Families in this group will be ungrouped.')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/family-groups?id=${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Group deleted successfully!' })
        fetchGroups()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to delete group' })
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      setMessage({ type: 'error', text: 'Failed to delete group' })
    }
  }

  const handleEdit = (group: FamilyGroup) => {
    setEditingGroup(group)
    setFormData(group)
    setShowModal(true)
  }

  const toggleFamily = (familyId: string) => {
    const isSelected = formData.families?.some(f => f._id === familyId)
    if (isSelected) {
      setFormData({
        ...formData,
        families: formData.families?.filter(f => f._id !== familyId) || []
      })
    } else {
      const family = families.find(f => f._id === familyId)
      if (family) {
        setFormData({
          ...formData,
          families: [...(formData.families || []), { _id: family._id, name: family.name }]
        })
      }
    }
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
            Family Groups
          </h1>
          <p className="text-gray-600">Organize families into groups and categories</p>
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
            <h2 className="text-2xl font-bold text-gray-800">Groups</h2>
            <button
              onClick={() => {
                setEditingGroup(null)
                setFormData({ name: '', color: '#3b82f6', description: '', families: [] })
                setShowModal(true)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              New Group
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <UserGroupIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No groups found. Create your first group to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <div
                  key={group._id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  style={{ borderLeftColor: group.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <h3 className="font-semibold text-gray-800">{group.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(group)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(group._id!)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {group.description && (
                    <p className="text-sm text-gray-600 mt-2 mb-2">{group.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {group.families?.length || 0} {group.families?.length === 1 ? 'family' : 'families'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold">{editingGroup ? 'Edit Group' : 'Create New Group'}</h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingGroup(null)
                    setFormData({ name: '', color: '#3b82f6', description: '', families: [] })
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., VIP Families, New Members, etc."
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Families</label>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                    {families.length === 0 ? (
                      <p className="text-sm text-gray-500">No families available</p>
                    ) : (
                      <div className="space-y-2">
                        {families.map((family) => {
                          const isSelected = formData.families?.some(f => f._id === family._id)
                          return (
                            <label
                              key={family._id}
                              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleFamily(family._id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{family.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingGroup(null)
                      setFormData({ name: '', color: '#3b82f6', description: '', families: [] })
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingGroup ? 'Update Group' : 'Create Group'}
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

