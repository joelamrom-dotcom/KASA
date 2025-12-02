'use client'

import { useState } from 'react'
import { XMarkIcon, PaintBrushIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface ConditionalFormatRule {
  condition: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'between'
  value: any
  value2?: any
  backgroundColor?: string
  textColor?: string
  fontWeight?: string
}

interface ConditionalFormattingEditorProps {
  fieldName: string
  fieldLabel: string
  rules?: ConditionalFormatRule[]
  onSave: (rules: ConditionalFormatRule[]) => void
  onCancel: () => void
}

export default function ConditionalFormattingEditor({
  fieldName,
  fieldLabel,
  rules = [],
  onSave,
  onCancel,
}: ConditionalFormattingEditorProps) {
  const [formatRules, setFormatRules] = useState<ConditionalFormatRule[]>(
    rules.length > 0 ? rules : []
  )

  const addRule = () => {
    setFormatRules([
      ...formatRules,
      {
        condition: 'greater_than',
        value: '',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        fontWeight: 'normal',
      },
    ])
  }

  const removeRule = (index: number) => {
    setFormatRules(formatRules.filter((_, i) => i !== index))
  }

  const updateRule = (index: number, updates: Partial<ConditionalFormatRule>) => {
    setFormatRules(
      formatRules.map((rule, i) => (i === index ? { ...rule, ...updates } : rule))
    )
  }

  const handleSave = () => {
    // Validate rules
    const validRules = formatRules.filter(
      (rule) =>
        rule.value !== '' &&
        (rule.condition !== 'between' || rule.value2 !== '') &&
        rule.backgroundColor &&
        rule.textColor
    )
    onSave(validRules)
  }

  const conditionOptions = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'contains', label: 'Contains' },
    { value: 'between', label: 'Between' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <PaintBrushIcon className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold">Conditional Formatting</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Field: <span className="text-gray-600">{fieldLabel}</span>
            </label>
            <p className="text-xs text-gray-500">
              Define formatting rules that apply when conditions are met. Rules are evaluated in order.
            </p>
          </div>

          {formatRules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No formatting rules defined.</p>
              <p className="text-sm mt-2">Click "Add Rule" to create a formatting rule.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formatRules.map((rule, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-sm">Rule {index + 1}</h4>
                    <button
                      onClick={() => removeRule(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Condition */}
                    <div>
                      <label className="block text-xs font-medium mb-1">Condition</label>
                      <select
                        value={rule.condition}
                        onChange={(e) =>
                          updateRule(index, {
                            condition: e.target.value as any,
                            value2: e.target.value === 'between' ? rule.value2 : undefined,
                          })
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                      >
                        {conditionOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Value */}
                    <div>
                      <label className="block text-xs font-medium mb-1">Value</label>
                      <input
                        type="text"
                        value={rule.value || ''}
                        onChange={(e) => updateRule(index, { value: e.target.value })}
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder="Enter value"
                      />
                    </div>

                    {/* Value 2 (for between) */}
                    {rule.condition === 'between' && (
                      <div>
                        <label className="block text-xs font-medium mb-1">Value 2</label>
                        <input
                          type="text"
                          value={rule.value2 || ''}
                          onChange={(e) => updateRule(index, { value2: e.target.value })}
                          className="w-full border rounded px-2 py-1 text-sm"
                          placeholder="Enter second value"
                        />
                      </div>
                    )}
                  </div>

                  {/* Formatting Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Background Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={rule.backgroundColor || '#ffffff'}
                          onChange={(e) => updateRule(index, { backgroundColor: e.target.value })}
                          className="w-12 h-8 border rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={rule.backgroundColor || '#ffffff'}
                          onChange={(e) => updateRule(index, { backgroundColor: e.target.value })}
                          className="flex-1 border rounded px-2 py-1 text-sm font-mono"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">Text Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={rule.textColor || '#000000'}
                          onChange={(e) => updateRule(index, { textColor: e.target.value })}
                          className="w-12 h-8 border rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={rule.textColor || '#000000'}
                          onChange={(e) => updateRule(index, { textColor: e.target.value })}
                          className="flex-1 border rounded px-2 py-1 text-sm font-mono"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">Font Weight</label>
                      <select
                        value={rule.fontWeight || 'normal'}
                        onChange={(e) => updateRule(index, { fontWeight: e.target.value })}
                        className="w-full border rounded px-2 py-1 text-sm"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="lighter">Lighter</option>
                      </select>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-3 p-2 bg-white rounded border">
                    <label className="block text-xs font-medium mb-1">Preview</label>
                    <div
                      style={{
                        backgroundColor: rule.backgroundColor || '#ffffff',
                        color: rule.textColor || '#000000',
                        fontWeight: rule.fontWeight || 'normal',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'inline-block',
                      }}
                    >
                      Sample Text
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={addRule}
            className="mt-4 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center gap-2 text-sm"
          >
            <PlusIcon className="h-5 w-5" />
            Add Rule
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
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Save Formatting
          </button>
        </div>
      </div>
    </div>
  )
}

