'use client'

import { useState } from 'react'
import { XMarkIcon, PlusIcon, TrashIcon, FunnelIcon } from '@heroicons/react/24/outline'

interface FilterCondition {
  fieldName: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'greater_than_or_equal' | 'less_than_or_equal'
  value: any
  value2?: any
  logicalOperator?: 'AND' | 'OR' // For combining multiple conditions
}

interface EnhancedFilterBuilderProps {
  availableFields: Array<{ fieldName: string; label: string; dataType: string }>
  filters?: FilterCondition[]
  onSave: (filters: FilterCondition[]) => void
  onCancel: () => void
}

export default function EnhancedFilterBuilder({
  availableFields,
  filters = [],
  onSave,
  onCancel,
}: EnhancedFilterBuilderProps) {
  const [filterGroups, setFilterGroups] = useState<FilterCondition[][]>(
    filters.length > 0 ? [filters] : [[]]
  )
  const [groupOperators, setGroupOperators] = useState<('AND' | 'OR')[]>(['AND'])

  const addGroup = () => {
    setFilterGroups([...filterGroups, []])
    setGroupOperators([...groupOperators, 'AND'])
  }

  const removeGroup = (groupIndex: number) => {
    setFilterGroups(filterGroups.filter((_, i) => i !== groupIndex))
    setGroupOperators(groupOperators.filter((_, i) => i !== groupIndex))
  }

  const addCondition = (groupIndex: number) => {
    const newGroups = [...filterGroups]
    newGroups[groupIndex] = [
      ...newGroups[groupIndex],
      {
        fieldName: availableFields[0]?.fieldName || '',
        operator: 'equals',
        value: '',
        logicalOperator: 'AND',
      },
    ]
    setFilterGroups(newGroups)
  }

  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    const newGroups = [...filterGroups]
    newGroups[groupIndex] = newGroups[groupIndex].filter((_, i) => i !== conditionIndex)
    setFilterGroups(newGroups)
  }

  const updateCondition = (
    groupIndex: number,
    conditionIndex: number,
    updates: Partial<FilterCondition>
  ) => {
    const newGroups = [...filterGroups]
    newGroups[groupIndex][conditionIndex] = {
      ...newGroups[groupIndex][conditionIndex],
      ...updates,
    }
    setFilterGroups(newGroups)
  }

  const updateGroupOperator = (index: number, operator: 'AND' | 'OR') => {
    const newOperators = [...groupOperators]
    newOperators[index] = operator
    setGroupOperators(newOperators)
  }

  const handleSave = () => {
    // Flatten groups with operators
    const allFilters: FilterCondition[] = []
    filterGroups.forEach((group, groupIndex) => {
      group.forEach((condition, conditionIndex) => {
        if (conditionIndex > 0) {
          condition.logicalOperator = groupOperators[groupIndex]
        }
        allFilters.push(condition)
      })
    })
    onSave(allFilters.filter(f => f.fieldName && f.value !== ''))
  }

  const operatorOptions = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'greater_than_or_equal', label: 'Greater Than or Equal' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'less_than_or_equal', label: 'Less Than or Equal' },
    { value: 'between', label: 'Between' },
    { value: 'in', label: 'In' },
    { value: 'not_in', label: 'Not In' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ]

  const getFieldDataType = (fieldName: string) => {
    return availableFields.find(f => f.fieldName === fieldName)?.dataType || 'string'
  }

  const renderValueInput = (condition: FilterCondition, groupIndex: number, conditionIndex: number) => {
    const dataType = getFieldDataType(condition.fieldName)
    const needsValue2 = condition.operator === 'between'
    const noValueNeeded = condition.operator === 'is_empty' || condition.operator === 'is_not_empty'

    if (noValueNeeded) {
      return null
    }

    if (needsValue2) {
      return (
        <div className="flex gap-2 items-center">
          <input
            type={dataType === 'date' ? 'date' : dataType === 'number' ? 'number' : 'text'}
            value={condition.value || ''}
            onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
            className="flex-1 border rounded px-2 py-1 text-sm"
            placeholder="Value 1"
          />
          <span className="text-gray-500">and</span>
          <input
            type={dataType === 'date' ? 'date' : dataType === 'number' ? 'number' : 'text'}
            value={condition.value2 || ''}
            onChange={(e) => updateCondition(groupIndex, conditionIndex, { value2: e.target.value })}
            className="flex-1 border rounded px-2 py-1 text-sm"
            placeholder="Value 2"
          />
        </div>
      )
    }

    if (condition.operator === 'in' || condition.operator === 'not_in') {
      return (
        <textarea
          value={Array.isArray(condition.value) ? condition.value.join(', ') : condition.value || ''}
          onChange={(e) => {
            const values = e.target.value.split(',').map(v => v.trim()).filter(v => v)
            updateCondition(groupIndex, conditionIndex, { value: values })
          }}
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="Enter values separated by commas"
          rows={2}
        />
      )
    }

    return (
      <input
        type={dataType === 'date' ? 'date' : dataType === 'number' ? 'number' : 'text'}
        value={condition.value || ''}
        onChange={(e) => updateCondition(groupIndex, conditionIndex, { value: e.target.value })}
        className="w-full border rounded px-2 py-1 text-sm"
        placeholder="Enter value"
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Filter Builder</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-600 mb-4">
            Build complex filters with multiple conditions. Conditions within a group are combined with AND/OR.
          </p>

          {filterGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-4 border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-sm">Filter Group {groupIndex + 1}</h4>
                {filterGroups.length > 1 && (
                  <button
                    onClick={() => removeGroup(groupIndex)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove Group
                  </button>
                )}
              </div>

              {group.length === 0 ? (
                <button
                  onClick={() => addCondition(groupIndex)}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center gap-2 text-sm"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Condition
                </button>
              ) : (
                <div className="space-y-3">
                  {group.map((condition, conditionIndex) => (
                    <div key={conditionIndex} className="bg-white rounded p-3 border">
                      <div className="flex items-start gap-2">
                        {conditionIndex > 0 && (
                          <select
                            value={groupOperators[groupIndex]}
                            onChange={(e) => updateGroupOperator(groupIndex, e.target.value as 'AND' | 'OR')}
                            className="mt-1 border rounded px-2 py-1 text-sm font-semibold"
                          >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                          </select>
                        )}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                          <select
                            value={condition.fieldName}
                            onChange={(e) => updateCondition(groupIndex, conditionIndex, { fieldName: e.target.value })}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="">Select Field</option>
                            {availableFields.map((field) => (
                              <option key={field.fieldName} value={field.fieldName}>
                                {field.label}
                              </option>
                            ))}
                          </select>

                          <select
                            value={condition.operator}
                            onChange={(e) => updateCondition(groupIndex, conditionIndex, { operator: e.target.value as any })}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            {operatorOptions.map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>

                          <div className="md:col-span-2">
                            {renderValueInput(condition, groupIndex, conditionIndex)}
                          </div>
                        </div>

                        <button
                          onClick={() => removeCondition(groupIndex, conditionIndex)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addCondition(groupIndex)}
                    className="w-full px-3 py-2 border border-dashed border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center gap-2 text-sm"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Condition
                  </button>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addGroup}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center gap-2 text-sm"
          >
            <PlusIcon className="h-5 w-5" />
            Add Filter Group
          </button>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}

