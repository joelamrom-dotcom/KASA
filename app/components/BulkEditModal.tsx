'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Modal from './Modal'
import FormField from './FormField'
import { showToast } from './Toast'

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  entityType: 'family' | 'payment' | 'member'
  fields: Array<{
    id: string
    label: string
    type: 'text' | 'number' | 'date' | 'select' | 'boolean'
    options?: Array<{ value: string; label: string }>
  }>
  onSave: (updates: Record<string, any>) => Promise<void>
}

export default function BulkEditModal({
  isOpen,
  onClose,
  selectedCount,
  entityType,
  fields,
  onSave,
}: BulkEditModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({})
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Filter out empty values
    const updates = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
    )

    if (Object.keys(updates).length === 0) {
      showToast('Please select at least one field to update', 'warning')
      return
    }

    setLoading(true)
    try {
      await onSave(updates)
      showToast(`Successfully updated ${selectedCount} ${entityType}${selectedCount !== 1 ? 's' : ''}`, 'success')
      onClose()
      setFormData({})
    } catch (error: any) {
      showToast(error.message || 'Failed to update items', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Bulk Edit ${selectedCount} ${entityType}${selectedCount !== 1 ? 's' : ''}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Update the selected fields for {selectedCount} {entityType}{selectedCount !== 1 ? 's' : ''}. Leave fields empty to keep their current values.
        </p>

        {fields.map((field) => {
          if (field.type === 'boolean') {
            return (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={field.id}
                  checked={formData[field.id] || false}
                  onChange={(e) => {
                    setFormData({ ...formData, [field.id]: e.target.checked })
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={field.id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.label}
                </label>
              </div>
            )
          }
          return (
            <FormField
              key={field.id}
              label={field.label}
              name={field.id}
              type={field.type === 'select' ? 'select' : field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
              value={formData[field.id] || ''}
              onChange={(e) => {
                const value = field.type === 'number' 
                  ? e.target.value === '' ? '' : Number(e.target.value)
                  : e.target.value
                setFormData({ ...formData, [field.id]: value })
              }}
              options={field.options}
              placeholder={`Leave empty to keep current ${field.label.toLowerCase()}`}
            />
          )
        })}

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
            disabled={loading}
          >
            {loading ? 'Updating...' : `Update ${selectedCount} ${entityType}${selectedCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </form>
    </Modal>
  )
}

