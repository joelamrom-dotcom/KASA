'use client'

import { useState } from 'react'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { AVAILABLE_VARIABLES, AvailableVariable } from '@/lib/template-variables'

interface VariablePickerProps {
  onSelectVariable: (variable: string) => void
  type?: 'email' | 'sms'
}

export default function VariablePicker({ onSelectVariable, type = 'email' }: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = ['family', 'payment', 'member', 'system'] as const
  
  const filteredVariables = AVAILABLE_VARIABLES.filter(variable => {
    // Filter by type (SMS should exclude HTML-heavy variables)
    if (type === 'sms') {
      // SMS-friendly variables only
      const smsFriendly = ['family', 'payment', 'system']
      if (!smsFriendly.includes(variable.category)) return false
    }
    
    // Filter by category
    if (selectedCategory && variable.category !== selectedCategory) return false
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        variable.name.toLowerCase().includes(query) ||
        variable.displayName.toLowerCase().includes(query) ||
        variable.description?.toLowerCase().includes(query)
      )
    }
    
    return true
  })

  const handleSelect = (variable: AvailableVariable) => {
    onSelectVariable(`{{${variable.name}}}`)
    setIsOpen(false)
    setSearchQuery('')
  }

  const groupedVariables = categories.reduce((acc, category) => {
    const vars = filteredVariables.filter(v => v.category === category)
    if (vars.length > 0) {
      acc[category] = vars
    }
    return acc
  }, {} as Record<string, AvailableVariable[]>)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span>Insert Variable</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search variables..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="p-2 border-b border-gray-200 flex gap-1 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2 py-1 text-xs rounded ${
                  selectedCategory === null
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map(category => {
                const count = AVAILABLE_VARIABLES.filter(v => v.category === category).length
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-2 py-1 text-xs rounded capitalize ${
                      selectedCategory === category
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category} ({count})
                  </button>
                )
              })}
            </div>

            {/* Variables List */}
            <div className="overflow-y-auto max-h-64">
              {Object.keys(groupedVariables).length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No variables found
                </div>
              ) : (
                Object.entries(groupedVariables).map(([category, variables]) => (
                  <div key={category} className="border-b border-gray-100 last:border-b-0">
                    <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-700 uppercase">
                      {category}
                    </div>
                    {variables.map(variable => (
                      <button
                        key={variable.name}
                        onClick={() => handleSelect(variable)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {variable.displayName}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {variable.description || `{{${variable.name}}}`}
                            </div>
                          </div>
                          <code className="ml-2 text-xs text-blue-600 font-mono">
                            {`{{${variable.name}}}`}
                          </code>
                        </div>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

