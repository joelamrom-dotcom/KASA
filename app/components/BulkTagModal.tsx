'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'
import FormField from './FormField'
import { showToast } from './Toast'
import Badge from './Badge'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface BulkTagModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  entityType: 'family' | 'payment' | 'member'
  existingTags?: string[]
  onSave: (tags: string[], action: 'add' | 'remove') => Promise<void>
}

export default function BulkTagModal({
  isOpen,
  onClose,
  selectedCount,
  entityType,
  existingTags = [],
  onSave,
}: BulkTagModalProps) {
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'add' | 'remove'>('add')

  useEffect(() => {
    if (isOpen) {
      setTags([])
      setNewTag('')
      setAction('add')
    }
  }, [isOpen])

  const handleAddTag = () => {
    const tag = newTag.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (tags.length === 0) {
      showToast('Please add at least one tag', 'warning')
      return
    }

    setLoading(true)
    try {
      await onSave(tags, action)
      showToast(
        `Successfully ${action === 'add' ? 'tagged' : 'untagged'} ${selectedCount} ${entityType}${selectedCount !== 1 ? 's' : ''}`,
        'success'
      )
      onClose()
      setTags([])
      setNewTag('')
    } catch (error: any) {
      showToast(error.message || `Failed to ${action} tags`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Bulk Tag ${selectedCount} ${entityType}${selectedCount !== 1 ? 's' : ''}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Action
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="action"
                value="add"
                checked={action === 'add'}
                onChange={(e) => setAction(e.target.value as 'add' | 'remove')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Add Tags</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="action"
                value="remove"
                checked={action === 'remove'}
                onChange={(e) => setAction(e.target.value as 'add' | 'remove')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Remove Tags</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter tag name and press Enter"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="info" size="sm" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {existingTags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Existing Tags (click to add)
            </label>
            <div className="flex flex-wrap gap-2">
              {existingTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (!tags.includes(tag)) {
                      setTags([...tags, tag])
                    }
                  }}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

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
            disabled={loading || tags.length === 0}
          >
            {loading ? 'Processing...' : `${action === 'add' ? 'Add' : 'Remove'} Tags`}
          </button>
        </div>
      </form>
    </Modal>
  )
}

