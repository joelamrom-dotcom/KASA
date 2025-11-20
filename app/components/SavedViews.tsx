'use client'

import { useState, useEffect } from 'react'
import {
  BookmarkIcon,
  BookmarkSlashIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import Dropdown from './Dropdown'
import Modal from './Modal'
import FormField from './FormField'
import { FilterGroup } from './FilterBuilder'

interface SavedView {
  _id?: string
  id?: string
  name: string
  description?: string
  filters: FilterGroup[]
  isDefault?: boolean
  isPublic?: boolean
  entityType: string
  userId?: string
}

interface SavedViewsProps {
  entityType: string
  currentFilters: FilterGroup[]
  onLoadView: (filters: FilterGroup[]) => void
  onSaveView?: (view: Omit<SavedView, '_id' | 'id'>) => Promise<void>
  onDeleteView?: (viewId: string) => Promise<void>
  onUpdateView?: (viewId: string, updates: Partial<SavedView>) => Promise<void>
  className?: string
}

export default function SavedViews({
  entityType,
  currentFilters,
  onLoadView,
  onSaveView,
  onDeleteView,
  onUpdateView,
  className = '',
}: SavedViewsProps) {
  const [views, setViews] = useState<SavedView[]>([])
  const [loading, setLoading] = useState(true)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [editingView, setEditingView] = useState<SavedView | null>(null)
  const [viewForm, setViewForm] = useState({
    name: '',
    description: '',
    isDefault: false,
    isPublic: false,
  })

  useEffect(() => {
    fetchViews()
  }, [entityType])

  const fetchViews = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kasa/saved-views?entityType=${entityType}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setViews(data || [])
      }
    } catch (error) {
      console.error('Error fetching saved views:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveView = async () => {
    if (!viewForm.name.trim()) {
      alert('Please enter a view name')
      return
    }

    if (!onSaveView) {
      // Default save implementation
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/kasa/saved-views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: viewForm.name,
            description: viewForm.description,
            filters: currentFilters,
            entityType,
            isDefault: viewForm.isDefault,
            isPublic: viewForm.isPublic,
          }),
        })

        if (res.ok) {
          await fetchViews()
          setShowSaveModal(false)
          setViewForm({ name: '', description: '', isDefault: false, isPublic: false })
        }
      } catch (error) {
        console.error('Error saving view:', error)
        alert('Failed to save view')
      }
    } else {
      await onSaveView({
        name: viewForm.name,
        description: viewForm.description,
        filters: currentFilters,
        entityType,
        isDefault: viewForm.isDefault,
        isPublic: viewForm.isPublic,
      })
      await fetchViews()
      setShowSaveModal(false)
      setViewForm({ name: '', description: '', isDefault: false, isPublic: false })
    }
  }

  const handleDeleteView = async (viewId: string) => {
    if (!confirm('Are you sure you want to delete this saved view?')) return

    if (!onDeleteView) {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`/api/kasa/saved-views/${viewId}`, {
          method: 'DELETE',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })

        if (res.ok) {
          await fetchViews()
        }
      } catch (error) {
        console.error('Error deleting view:', error)
        alert('Failed to delete view')
      }
    } else {
      await onDeleteView(viewId)
      await fetchViews()
    }
  }

  const handleSetDefault = async (viewId: string) => {
    if (!onUpdateView) {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`/api/kasa/saved-views/${viewId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ isDefault: true }),
        })

        if (res.ok) {
          await fetchViews()
        }
      } catch (error) {
        console.error('Error updating view:', error)
      }
    } else {
      await onUpdateView(viewId, { isDefault: true })
      await fetchViews()
    }
  }

  const handleLoadView = (view: SavedView) => {
    onLoadView(view.filters)
  }

  const dropdownItems = [
    ...views.map((view) => ({
      id: view._id || view.id || '',
      label: view.name,
      icon: view.isDefault ? <StarIconSolid className="h-4 w-4 text-yellow-500" /> : undefined,
      onClick: () => handleLoadView(view),
    })),
    { id: 'divider-1', label: '', divider: true },
    {
      id: 'save',
      label: 'Save Current View',
      icon: <PlusIcon className="h-4 w-4" />,
      onClick: () => {
        setEditingView(null)
        setViewForm({
          name: '',
          description: '',
          isDefault: false,
          isPublic: false,
        })
        setShowSaveModal(true)
      },
    },
  ]

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 w-32 rounded-lg"></div>
      </div>
    )
  }

  return (
    <>
      <Dropdown
        trigger={
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <BookmarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Views</span>
            {views.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">({views.length})</span>
            )}
          </button>
        }
        items={dropdownItems}
        position="bottom"
        className={className}
      />

      <Modal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false)
          setEditingView(null)
          setViewForm({ name: '', description: '', isDefault: false, isPublic: false })
        }}
        title={editingView ? 'Edit Saved View' : 'Save Current View'}
        size="md"
      >
        <div className="space-y-4">
          <FormField
            label="View Name"
            name="name"
            type="text"
            value={viewForm.name}
            onChange={(e) => setViewForm({ ...viewForm, name: e.target.value })}
            placeholder="e.g., Overdue Payments"
            required
          />
          <FormField
            label="Description"
            name="description"
            type="textarea"
            value={viewForm.description}
            onChange={(e) => setViewForm({ ...viewForm, description: e.target.value })}
            placeholder="Optional description"
            rows={3}
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={viewForm.isDefault}
                onChange={(e) => setViewForm({ ...viewForm, isDefault: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Set as default</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={viewForm.isPublic}
                onChange={(e) => setViewForm({ ...viewForm, isPublic: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Make public</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setShowSaveModal(false)
                setEditingView(null)
                setViewForm({ name: '', description: '', isDefault: false, isPublic: false })
              }}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveView}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingView ? 'Update View' : 'Save View'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

