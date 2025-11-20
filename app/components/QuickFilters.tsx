'use client'

import { FilterGroup } from './FilterBuilder'

interface QuickFilter {
  id: string
  name: string
  icon?: string
  filters: FilterGroup[]
  color?: string
}

interface QuickFiltersProps {
  entityType: string
  onApplyFilter: (filters: FilterGroup[]) => void
  customFilters?: QuickFilter[]
}

export default function QuickFilters({ entityType, onApplyFilter, customFilters }: QuickFiltersProps) {
  // Default quick filters based on entity type
  const defaultFilters: Record<string, QuickFilter[]> = {
    family: [
      {
        id: 'high_balance',
        name: 'High Balance',
        filters: [{
          id: '1',
          logic: 'AND',
          conditions: [{
            id: '1',
            field: 'openBalance',
            operator: 'greaterThan',
            value: 1000
          }]
        }],
        color: 'bg-red-100 text-red-800'
      },
      {
        id: 'no_members',
        name: 'No Members',
        filters: [{
          id: '1',
          logic: 'AND',
          conditions: [{
            id: '1',
            field: 'memberCount',
            operator: 'equals',
            value: 0
          }]
        }],
        color: 'bg-yellow-100 text-yellow-800'
      },
      {
        id: 'recent_weddings',
        name: 'Recent Weddings',
        filters: [{
          id: '1',
          logic: 'AND',
          conditions: [{
            id: '1',
            field: 'weddingDate',
            operator: 'greaterThan',
            value: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }]
        }],
        color: 'bg-pink-100 text-pink-800'
      },
      {
        id: 'with_email',
        name: 'Has Email',
        filters: [{
          id: '1',
          logic: 'AND',
          conditions: [{
            id: '1',
            field: 'email',
            operator: 'isNotEmpty',
            value: ''
          }]
        }],
        color: 'bg-blue-100 text-blue-800'
      }
    ],
    payment: [
      {
        id: 'this_month',
        name: 'This Month',
        filters: [{
          id: '1',
          logic: 'AND',
          conditions: [{
            id: '1',
            field: 'paymentDate',
            operator: 'between',
            value: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            value2: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
          }]
        }],
        color: 'bg-green-100 text-green-800'
      },
      {
        id: 'credit_card',
        name: 'Credit Card',
        filters: [{
          id: '1',
          logic: 'AND',
          conditions: [{
            id: '1',
            field: 'paymentMethod',
            operator: 'equals',
            value: 'credit_card'
          }]
        }],
        color: 'bg-blue-100 text-blue-800'
      },
      {
        id: 'large_payments',
        name: 'Large Payments ($500+)',
        filters: [{
          id: '1',
          logic: 'AND',
          conditions: [{
            id: '1',
            field: 'amount',
            operator: 'greaterThan',
            value: 500
          }]
        }],
        color: 'bg-purple-100 text-purple-800'
      }
    ]
  }

  const quickFilters = customFilters || defaultFilters[entityType] || []

  if (quickFilters.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <span className="text-sm text-gray-600 font-medium">Quick Filters:</span>
      {quickFilters.map(filter => (
        <button
          key={filter.id}
          onClick={() => onApplyFilter(filter.filters)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter.color || 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {filter.name}
        </button>
      ))}
    </div>
  )
}

