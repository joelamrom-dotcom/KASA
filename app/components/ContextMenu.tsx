'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ContextMenuOption {
  label: string
  icon?: any
  action: () => void
  divider?: boolean
  danger?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  options: ContextMenuOption[]
  onClose: () => void
}

export default function ContextMenu({ x, y, options, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[200px]"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      {options.map((option, idx) => (
        <div key={idx}>
          {option.divider && <div className="border-t border-gray-200 my-1" />}
          <button
            onClick={() => {
              option.action()
              onClose()
            }}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
              option.danger ? 'text-red-600' : 'text-gray-700'
            }`}
          >
            {option.icon && <option.icon className="h-4 w-4" />}
            {option.label}
          </button>
        </div>
      ))}
    </div>
  )
}

