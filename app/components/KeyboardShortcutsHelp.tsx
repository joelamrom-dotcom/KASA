'use client'

import { useState, useEffect } from 'react'
import { CommandLineIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Modal from '@/app/components/Modal'

const shortcuts = [
  { key: 'Ctrl+K / Cmd+K', description: 'Open global search' },
  { key: 'Ctrl+N / Cmd+N', description: 'Create new family' },
  { key: 'Ctrl+P / Cmd+P', description: 'Create new payment' },
  { key: 'Ctrl+/', description: 'Show keyboard shortcuts' },
  { key: 'Esc', description: 'Close modal/dialog' },
  { key: 'Ctrl+S / Cmd+S', description: 'Save form' },
  { key: 'Ctrl+E / Cmd+E', description: 'Export data' },
  { key: 'Ctrl+F / Cmd+F', description: 'Find in page' },
]

export default function KeyboardShortcutsHelp() {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        setShowModal(true)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="p-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-600"
        title="Keyboard Shortcuts (Ctrl+/)"
      >
        <CommandLineIcon className="h-5 w-5" />
        <span className="hidden md:inline">Shortcuts</span>
      </button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6 max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
            <button
              onClick={() => setShowModal(false)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-3">
            {shortcuts.map((shortcut, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-gray-700">{shortcut.description}</span>
                <kbd className="px-3 py-1 bg-gray-100 rounded text-sm font-mono">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Tip: You can customize these shortcuts in Settings
            </p>
          </div>
        </div>
      </Modal>
    </>
  )
}

