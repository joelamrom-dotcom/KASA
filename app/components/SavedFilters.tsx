'use client'

import { useState, useEffect } from 'react'
import {
  BookmarkIcon,
  BookmarkSlashIcon,
  StarIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { FilterGroup } from './FilterBuilder'

interface SavedFilter {
  _id: string
  name: string
  entityType: string
  filters: FilterGroup[]
  isDefault?: boolean
  isPublic?: boolean
  createdAt?: string
}

interface SavedFiltersProps {
  entityType: string
  currentFilters: FilterGroup[]
  onLoadFilter: (filters: FilterGroup[]) => void
  onSaveFilter?: (name: string, filters: FilterGroup[], isDefault?: boolean) => void
}

export default function SavedFilters({
  entityType,
  currentFilters,
  onLoadFilter,
  onSaveFilter
}: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [loading, setLoading] = useState(true)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [filterName, setFilterName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [editingFilter, setEditingFilter] = useState<SavedFilter | null>(null)

  useEffect(() => {
    fetchSavedFilters()
  }, [entityType])

  const fetchSavedFilters = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
      
      const res = await fetch(`/api/kasa/saved-views?entityType=${entityType}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setSavedFilters(data.views || [])
      }
    } catch (error) {
      console.error('Error fetching saved filters:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFilter = async () => {
    if (!filterName.trim() || !onSaveFilter) return

    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = token 
        ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' }

      const res = await fetch('/api/kasa/saved-views', {
        method: editingFilter ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify({
          id: editingFilter?._id,
          name: filterName,
          entityType,
          filters: currentFilters,
          isDefault
        })
      })

      if (res.ok) {
        await fetchSavedFilters()
        setShowSaveModal(false)
        setFilterName('')
        setIsDefault(false)
        setEditingFilter(null)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save filter')
      }
    } catch (error) {
      console.error('Error saving filter:', error)
      alert('Failed to save filter')
    }
  }

  const handleDeleteFilter = async (filterId: string) => {
    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}

      const res = await fetch(`/api/kasa/saved-views/${filterId}`, {
        method: 'DELETE',
        headers
      })

      if (res.ok) {
        await fetchSavedFilters()
        setShowDeleteConfirm(null)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete filter')
      }
    } catch (error) {
      console.error('Error deleting filter:', error)
      alert('Failed to delete filter')
    }
  }

  const handleLoadFilter = (filter: SavedFilter) => {
    onLoadFilter(filter.filters || [])
  }

  const handleEditFilter = (filter: SavedFilter) => {
    setEditingFilter(filter)
    setFilterName(filter.name)
    setIsDefault(filter.isDefault || false)
    setShowSaveModal(true)
  }

  const activeFilterCount = currentFilters.reduce((sum, group) => sum + group.conditions.length, 0)

  if (loading) {
    return <div className="text-sm text-gray-500">Loading filters...</div>
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Saved Filters Dropdown */}
        {savedFilters.length > 0 && (
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <BookmarkIcon className="h-4 w-4" />
              <span>Saved Filters</span>
              <span className="text-xs text-gray-500">({savedFilters.length})</span>
            </button>
            
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="p-2 max-h-64 overflow-y-auto">
                {savedFilters.map(filter => (
                  <div
                    key={filter._id}
                    className="p-2 hover:bg-gray-50 rounded cursor-pointer group/item"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1" onClick={() => handleLoadFilter(filter)}>
                        <div className="flex items-center gap-2">
                          {filter.isDefault && (
                            <StarIcon className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm font-medium">{filter.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {filter.filters?.reduce((sum, g) => sum + g.conditions.length, 0) || 0} conditions
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100">
                        <button
                          onClick={() => handleEditFilter(filter)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Edit"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(filter._id)}
                          className="p-1 hover:bg-red-100 rounded"
                          title="Delete"
                        >
                          <TrashIcon className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Save Current Filter Button */}
        {onSaveFilter && activeFilterCount > 0 && (
          <button
            onClick={() => {
              setEditingFilter(null)
              setFilterName('')
              setIsDefault(false)
              setShowSaveModal(true)
            }}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <BookmarkIcon className="h-4 w-4" />
            Save Filter
          </button>
        )}
      </div>

      {/* Save Filter Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingFilter ? 'Edit Filter' : 'Save Filter'}
              </h2>
              <button
                onClick={() => {
                  setShowSaveModal(false)
                  setEditingFilter(null)
                  setFilterName('')
                  setIsDefault(false)
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Filter Name *</label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., High Balance Families"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="isDefault" className="text-sm">
                  Set as default filter
                </label>
              </div>
              <div className="text-xs text-gray-500">
                {activeFilterCount} condition{activeFilterCount !== 1 ? 's' : ''} will be saved
              </div>
              <div className="flex gap-4 justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    setShowSaveModal(false)
                    setEditingFilter(null)
                    setFilterName('')
                    setIsDefault(false)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFilter}
                  disabled={!filterName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingFilter ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Delete Filter?</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this filter? This action cannot be undone.
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteFilter(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

