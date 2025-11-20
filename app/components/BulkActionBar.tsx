'use client'

import { useState } from 'react'
import {
  PencilIcon,
  TrashIcon,
  TagIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Badge from './Badge'
import ConfirmationDialog from './ConfirmationDialog'

interface BulkActionBarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onSelectNone: () => void
  onBulkEdit?: () => void
  onBulkDelete?: () => void
  onBulkTag?: () => void
  onBulkEmail?: () => void
  onBulkSMS?: () => void
  onBulkExport?: () => void
  availableActions?: {
    edit?: boolean
    delete?: boolean
    tag?: boolean
    email?: boolean
    sms?: boolean
    export?: boolean
  }
  className?: string
}

export default function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onSelectNone,
  onBulkEdit,
  onBulkDelete,
  onBulkTag,
  onBulkEmail,
  onBulkSMS,
  onBulkExport,
  availableActions = {
    edit: true,
    delete: true,
    tag: true,
    email: true,
    sms: true,
    export: true,
  },
  className = '',
}: BulkActionBarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (selectedCount === 0) {
    return null
  }

  const handleBulkDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (onBulkDelete) {
      onBulkDelete()
    }
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <div
        className={`fixed bottom-0 left-0 right-0 md:left-64 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40 transition-all duration-300 ${className}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="info" size="sm">
                  {selectedCount} selected
                </Badge>
                <button
                  onClick={onSelectNone}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Clear
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">|</span>
                <button
                  onClick={onSelectAll}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Select All ({totalCount})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {availableActions.edit && onBulkEdit && (
                <button
                  onClick={onBulkEdit}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </button>
              )}

              {availableActions.tag && onBulkTag && (
                <button
                  onClick={onBulkTag}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <TagIcon className="h-4 w-4" />
                  Tag
                </button>
              )}

              {availableActions.email && onBulkEmail && (
                <button
                  onClick={onBulkEmail}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                  Email
                </button>
              )}

              {availableActions.sms && onBulkSMS && (
                <button
                  onClick={onBulkSMS}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  SMS
                </button>
              )}

              {availableActions.export && onBulkExport && (
                <button
                  onClick={onBulkExport}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export
                </button>
              )}

              {availableActions.delete && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Selected Items"
        message={`Are you sure you want to delete ${selectedCount} item${selectedCount !== 1 ? 's' : ''}? This will move them to the recycle bin.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setShowDeleteConfirm(false)}
        type="danger"
      />
    </>
  )
}

