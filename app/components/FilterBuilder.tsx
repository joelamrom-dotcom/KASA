'use client'

import { useState } from 'react'
import {
  FunnelIcon,
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import Badge from './Badge'
import Dropdown from './Dropdown'

export type FilterOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn' | 'isEmpty' | 'isNotEmpty'

export interface FilterCondition {
  id: string
  field: string
  operator: FilterOperator
  value: any
  value2?: any // For 'between' operator
}

export interface FilterGroup {
  id: string
  conditions: FilterCondition[]
  logic: 'AND' | 'OR'
}

interface FilterBuilderProps {
  fields: Array<{
    id: string
    label: string
    type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'multiselect'
    options?: Array<{ value: string; label: string }>
  }>
  filters: FilterGroup[]
  onChange: (filters: FilterGroup[]) => void
  onApply: () => void
  onClear: () => void
  className?: string
}

const operatorLabels: Record<FilterOperator, string> = {
  equals: 'equals',
  contains: 'contains',
  startsWith: 'starts with',
  endsWith: 'ends with',
  greaterThan: 'greater than',
  lessThan: 'less than',
  between: 'between',
  in: 'is one of',
  notIn: 'is not one of',
  isEmpty: 'is empty',
  isNotEmpty: 'is not empty',
}

const operatorsByType: Record<string, FilterOperator[]> = {
  text: ['equals', 'contains', 'startsWith', 'endsWith', 'isEmpty', 'isNotEmpty'],
  number: ['equals', 'greaterThan', 'lessThan', 'between', 'isEmpty', 'isNotEmpty'],
  date: ['equals', 'greaterThan', 'lessThan', 'between', 'isEmpty', 'isNotEmpty'],
  select: ['equals', 'in', 'notIn', 'isEmpty', 'isNotEmpty'],
  multiselect: ['in', 'notIn', 'isEmpty', 'isNotEmpty'],
  boolean: ['equals'],
}

export default function FilterBuilder({
  fields,
  filters,
  onChange,
  onApply,
  onClear,
  className = '',
}: FilterBuilderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const addFilterGroup = () => {
    const newGroup: FilterGroup = {
      id: Math.random().toString(36).substring(7),
      conditions: [],
      logic: 'AND',
    }
    onChange([...filters, newGroup])
  }

  const removeFilterGroup = (groupId: string) => {
    onChange(filters.filter((g) => g.id !== groupId))
  }

  const addCondition = (groupId: string) => {
    const group = filters.find((g) => g.id === groupId)
    if (!group) return

    const firstField = fields[0]
    if (!firstField) return

    const newCondition: FilterCondition = {
      id: Math.random().toString(36).substring(7),
      field: firstField.id,
      operator: operatorsByType[firstField.type]?.[0] || 'equals',
      value: '',
    }

    group.conditions.push(newCondition)
    onChange([...filters])
  }

  const removeCondition = (groupId: string, conditionId: string) => {
    const group = filters.find((g) => g.id === groupId)
    if (!group) return

    group.conditions = group.conditions.filter((c) => c.id !== conditionId)
    onChange([...filters])
  }

  const updateCondition = (groupId: string, conditionId: string, updates: Partial<FilterCondition>) => {
    const group = filters.find((g) => g.id === groupId)
    if (!group) return

    const condition = group.conditions.find((c) => c.id === conditionId)
    if (!condition) return

    Object.assign(condition, updates)
    onChange([...filters])
  }

  const updateGroupLogic = (groupId: string, logic: 'AND' | 'OR') => {
    const group = filters.find((g) => g.id === groupId)
    if (!group) return

    group.logic = logic
    onChange([...filters])
  }

  const getField = (fieldId: string) => fields.find((f) => f.id === fieldId)
  const getOperators = (fieldId: string) => {
    const field = getField(fieldId)
    return field ? operatorsByType[field.type] || [] : []
  }

  const activeFilterCount = filters.reduce((sum, group) => sum + group.conditions.length, 0)

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
        {activeFilterCount > 0 && (
          <Badge variant="info" size="sm">
            {activeFilterCount}
          </Badge>
        )}
        <ChevronDownIcon className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-4 animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Advanced Filters</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {filters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No filters applied</p>
              <button
                onClick={addFilterGroup}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Filter Group
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filters.map((group, groupIndex) => (
                <div
                  key={group.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Group {groupIndex + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateGroupLogic(group.id, 'AND')}
                          className={`px-2 py-1 text-xs rounded ${
                            group.logic === 'AND'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          AND
                        </button>
                        <button
                          onClick={() => updateGroupLogic(group.id, 'OR')}
                          className={`px-2 py-1 text-xs rounded ${
                            group.logic === 'OR'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          OR
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFilterGroup(group.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {group.conditions.map((condition, conditionIndex) => {
                      const field = getField(condition.field)
                      const operators = getOperators(condition.field)
                      const needsValue = !['isEmpty', 'isNotEmpty'].includes(condition.operator)

                      return (
                        <div key={condition.id} className="flex items-start gap-2">
                          <select
                            value={condition.field}
                            onChange={(e) => {
                              const newField = getField(e.target.value)
                              updateCondition(group.id, condition.id, {
                                field: e.target.value,
                                operator: operatorsByType[newField?.type || 'text']?.[0] || 'equals',
                                value: '',
                              })
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                          >
                            {fields.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.label}
                              </option>
                            ))}
                          </select>

                          <select
                            value={condition.operator}
                            onChange={(e) =>
                              updateCondition(group.id, condition.id, {
                                operator: e.target.value as FilterOperator,
                                value: condition.operator === 'between' ? condition.value : '',
                              })
                            }
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                          >
                            {operators.map((op) => (
                              <option key={op} value={op}>
                                {operatorLabels[op]}
                              </option>
                            ))}
                          </select>

                          {needsValue && (
                            <>
                              {condition.operator === 'between' ? (
                                <>
                                  <input
                                    type={field?.type === 'date' ? 'date' : field?.type === 'number' ? 'number' : 'text'}
                                    value={condition.value || ''}
                                    onChange={(e) =>
                                      updateCondition(group.id, condition.id, { value: e.target.value })
                                    }
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                    placeholder="From"
                                  />
                                  <input
                                    type={field?.type === 'date' ? 'date' : field?.type === 'number' ? 'number' : 'text'}
                                    value={condition.value2 || ''}
                                    onChange={(e) =>
                                      updateCondition(group.id, condition.id, { value2: e.target.value })
                                    }
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                    placeholder="To"
                                  />
                                </>
                              ) : field?.type === 'select' || field?.type === 'multiselect' ? (
                                <select
                                  multiple={field.type === 'multiselect'}
                                  value={field.type === 'multiselect' ? (condition.value || []) : condition.value}
                                  onChange={(e) => {
                                    if (field.type === 'multiselect') {
                                      const values = Array.from(e.target.selectedOptions, (opt) => opt.value)
                                      updateCondition(group.id, condition.id, { value: values })
                                    } else {
                                      updateCondition(group.id, condition.id, { value: e.target.value })
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                >
                                  {field.options?.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              ) : field?.type === 'boolean' ? (
                                <select
                                  value={condition.value}
                                  onChange={(e) =>
                                    updateCondition(group.id, condition.id, { value: e.target.value === 'true' })
                                  }
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                >
                                  <option value="true">Yes</option>
                                  <option value="false">No</option>
                                </select>
                              ) : (
                                <input
                                  type={field?.type === 'date' ? 'date' : field?.type === 'number' ? 'number' : 'text'}
                                  value={condition.value || ''}
                                  onChange={(e) =>
                                    updateCondition(group.id, condition.id, { value: e.target.value })
                                  }
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                  placeholder="Value"
                                />
                              )}
                            </>
                          )}

                          {conditionIndex < group.conditions.length - 1 && (
                            <span className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">
                              {group.logic}
                            </span>
                          )}

                          <button
                            onClick={() => removeCondition(group.id, condition.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 p-2"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })}

                    <button
                      onClick={() => addCondition(group.id)}
                      className="w-full mt-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-dashed border-blue-300 dark:border-blue-700 flex items-center justify-center gap-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Condition
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={addFilterGroup}
                  className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-blue-300 dark:border-blue-700"
                >
                  Add Filter Group
                </button>
                <button
                  onClick={onClear}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  Clear All
                </button>
                <button
                  onClick={() => {
                    onApply()
                    setIsOpen(false)
                  }}
                  className="ml-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

