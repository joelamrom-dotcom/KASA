'use client'

import { useState } from 'react'
import { 
  TrashIcon, 
  TagIcon, 
  EnvelopeIcon, 
  PencilIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface BulkActionsToolbarProps {
  selectedCount: number
  onDelete?: () => void
  onTag?: () => void
  onEmail?: () => void
  onEdit?: () => void
  onUpdate?: () => void
  onClearSelection?: () => void
}

export default function BulkActionsToolbar({
  selectedCount,
  onDelete,
  onTag,
  onEmail,
  onEdit,
  onUpdate,
  onClearSelection
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold">{selectedCount} item{selectedCount !== 1 ? 's' : ''} selected</span>
          <button
            onClick={onClearSelection}
            className="p-1 hover:bg-blue-700 rounded"
            title="Clear selection"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 flex items-center gap-2"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </button>
          )}
          {onTag && (
            <button
              onClick={onTag}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 flex items-center gap-2"
            >
              <TagIcon className="h-4 w-4" />
              Tag
            </button>
          )}
          {onEmail && (
            <button
              onClick={onEmail}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 flex items-center gap-2"
            >
              <EnvelopeIcon className="h-4 w-4" />
              Email
            </button>
          )}
          {onUpdate && (
            <button
              onClick={onUpdate}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 flex items-center gap-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Update
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

