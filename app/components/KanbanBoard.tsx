'use client'

import { useState } from 'react'
import { UserGroupIcon, CurrencyDollarIcon, CalendarIcon } from '@heroicons/react/24/outline'

interface KanbanColumn {
  id: string
  title: string
  items: any[]
  color: string
}

interface KanbanBoardProps<T> {
  items: T[]
  getItemId: (item: T) => string
  getItemStatus: (item: T) => string
  renderItem: (item: T) => React.ReactNode
  columns: Array<{
    id: string
    title: string
    status: string | string[]
    color: string
  }>
  onItemMove?: (itemId: string, newStatus: string) => void
  className?: string
}

export default function KanbanBoard<T extends Record<string, any>>({
  items,
  getItemId,
  getItemStatus,
  renderItem,
  columns,
  onItemMove,
  className = ''
}: KanbanBoardProps<T>) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  // Group items by status
  const groupedItems = columns.map(col => ({
    ...col,
    items: items.filter(item => {
      const status = getItemStatus(item)
      return Array.isArray(col.status) 
        ? col.status.includes(status)
        : status === col.status
    })
  }))

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    if (draggedItem && onItemMove) {
      const column = columns.find(c => c.id === columnId)
      if (column) {
        const status = Array.isArray(column.status) ? column.status[0] : column.status
        onItemMove(draggedItem, status)
      }
    }
    setDraggedItem(null)
  }

  return (
    <div className={`flex gap-4 overflow-x-auto pb-4 ${className}`}>
      {groupedItems.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 ${
              column.color === 'green' ? 'border-green-200 dark:border-green-800' :
              column.color === 'yellow' ? 'border-yellow-200 dark:border-yellow-800' :
              column.color === 'red' ? 'border-red-200 dark:border-red-800' :
              column.color === 'blue' ? 'border-blue-200 dark:border-blue-800' :
              'border-gray-200 dark:border-gray-800'
            }`}>
              {/* Column Header */}
              <div className={`px-4 py-3 border-b rounded-t-lg ${
                column.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                column.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                column.color === 'red' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                column.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{column.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    column.color === 'green' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                    column.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                    column.color === 'red' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                    column.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                    'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                  }`}>
                    {column.items.length}
                  </span>
                </div>
              </div>

            {/* Column Items */}
            <div className="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
              {column.items.length === 0 ? (
                <div className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">
                  No items
                </div>
              ) : (
                column.items.map((item) => (
                  <div
                    key={getItemId(item)}
                    draggable={!!onItemMove}
                    onDragStart={() => handleDragStart(getItemId(item))}
                    className={`bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600 cursor-move hover:shadow-md transition-shadow ${
                      draggedItem === getItemId(item) ? 'opacity-50' : ''
                    }`}
                  >
                    {renderItem(item)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

