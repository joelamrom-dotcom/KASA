'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface AdvancedSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
}

export default function AdvancedSearch({
  value,
  onChange,
  placeholder = 'Search...',
  onSearch,
  className = ''
}: AdvancedSearchProps) {
  const [showHelp, setShowHelp] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute inset-y-0 right-10 pr-3 flex items-center"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          title="Search help"
        >
          <InformationCircleIcon className="h-5 w-5 text-gray-400 hover:text-blue-600" />
        </button>
      </div>

      {/* Search Help Modal */}
      {showHelp && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-gray-900">Advanced Search Tips</h3>
            <button
              onClick={() => setShowHelp(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div>
              <strong>Basic Search:</strong> Type any text to search across all fields
            </div>
            <div>
              <strong>Field Search:</strong> Use <code className="bg-gray-100 px-1 rounded">field:value</code>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                <li><code>email:john@example.com</code></li>
                <li><code>city:New York</code></li>
                <li><code>balance:&gt;1000</code></li>
              </ul>
            </div>
            <div>
              <strong>Operators:</strong>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                <li><code>&gt;</code> greater than</li>
                <li><code>&lt;</code> less than</li>
                <li><code>:</code> field equals</li>
                <li><code>!</code> not (e.g., <code>!city:NYC</code>)</li>
              </ul>
            </div>
            <div>
              <strong>Examples:</strong>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                <li><code>email:gmail balance:&gt;500</code></li>
                <li><code>city:NYC !state:CA</code></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

