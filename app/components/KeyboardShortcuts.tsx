'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, CommandLineIcon } from '@heroicons/react/24/outline'

interface Shortcut {
  keys: string[]
  description: string
  category: string
}

const shortcuts: Shortcut[] = [
  { keys: ['Ctrl', 'K'], description: 'Open global search', category: 'Navigation' },
  { keys: ['Esc'], description: 'Close modals/dialogs', category: 'Navigation' },
  { keys: ['/', '/'], description: 'Focus search (on search pages)', category: 'Navigation' },
  { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts', category: 'Help' },
  { keys: ['Ctrl', 'S'], description: 'Save form (when available)', category: 'Actions' },
  { keys: ['Ctrl', 'Enter'], description: 'Submit form', category: 'Actions' },
  { keys: ['Ctrl', 'N'], description: 'New item (context-dependent)', category: 'Actions' },
  { keys: ['Ctrl', 'E'], description: 'Edit selected item', category: 'Actions' },
  { keys: ['Ctrl', 'D'], description: 'Delete selected item', category: 'Actions' },
  { keys: ['Ctrl', 'P'], description: 'Print current page', category: 'Actions' },
  { keys: ['Arrow Up'], description: 'Navigate up in lists', category: 'Navigation' },
  { keys: ['Arrow Down'], description: 'Navigate down in lists', category: 'Navigation' },
  { keys: ['Enter'], description: 'Select/Activate item', category: 'Navigation' },
]

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, Shortcut[]>)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CommandLineIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{category}</h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm text-gray-700">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          {keyIndex > 0 && <span className="text-gray-400 mx-1">+</span>}
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded shadow-sm">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded">/</kbd> to open this dialog anytime
          </p>
        </div>
      </div>
    </div>
  )
}

