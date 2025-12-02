'use client'

import { useState } from 'react'
import { XMarkIcon, CalculatorIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface FormulaBuilderProps {
  fieldName: string
  fieldLabel: string
  availableFields: Array<{ fieldName: string; label: string; dataType: string }>
  formula?: string
  onSave: (formula: string) => void
  onCancel: () => void
}

export default function FormulaBuilder({
  fieldName,
  fieldLabel,
  availableFields,
  formula = '',
  onSave,
  onCancel,
}: FormulaBuilderProps) {
  const [formulaText, setFormulaText] = useState(formula)
  const [error, setError] = useState<string | null>(null)

  const operators = [
    { symbol: '+', label: 'Add' },
    { symbol: '-', label: 'Subtract' },
    { symbol: '*', label: 'Multiply' },
    { symbol: '/', label: 'Divide' },
    { symbol: '%', label: 'Modulo' },
    { symbol: '(', label: 'Open Parenthesis' },
    { symbol: ')', label: 'Close Parenthesis' },
  ]

  const functions = [
    { name: 'SUM', description: 'Sum of values' },
    { name: 'AVG', description: 'Average of values' },
    { name: 'MIN', description: 'Minimum value' },
    { name: 'MAX', description: 'Maximum value' },
    { name: 'COUNT', description: 'Count of values' },
    { name: 'IF', description: 'Conditional: IF(condition, trueValue, falseValue)' },
    { name: 'ROUND', description: 'Round to decimal places: ROUND(value, decimals)' },
    { name: 'ABS', description: 'Absolute value' },
  ]

  const insertField = (field: string) => {
    const fieldRef = `{${field}}`
    setFormulaText((prev) => prev + fieldRef)
    setError(null)
  }

  const insertOperator = (op: string) => {
    setFormulaText((prev) => prev + op)
    setError(null)
  }

  const insertFunction = (func: string) => {
    if (func === 'IF') {
      setFormulaText((prev) => prev + `${func}(condition, trueValue, falseValue)`)
    } else if (func === 'ROUND') {
      setFormulaText((prev) => prev + `${func}(value, decimals)`)
    } else {
      setFormulaText((prev) => prev + `${func}()`)
    }
    setError(null)
  }

  const validateFormula = (): boolean => {
    if (!formulaText.trim()) {
      setError('Formula cannot be empty')
      return false
    }

    // Basic validation: check for balanced parentheses
    let openCount = 0
    for (const char of formulaText) {
      if (char === '(') openCount++
      if (char === ')') openCount--
      if (openCount < 0) {
        setError('Unbalanced parentheses')
        return false
      }
    }
    if (openCount !== 0) {
      setError('Unbalanced parentheses')
      return false
    }

    // Check for field references
    const fieldPattern = /\{[^}]+\}/g
    const matches = formulaText.match(fieldPattern) || []
    for (const match of matches) {
      const fieldName = match.slice(1, -1)
      if (!availableFields.find((f) => f.fieldName === fieldName)) {
        setError(`Unknown field: ${fieldName}`)
        return false
      }
    }

    setError(null)
    return true
  }

  const handleSave = () => {
    if (validateFormula()) {
      onSave(formulaText)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <CalculatorIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Formula Builder</h3>
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
            <p className="text-xs text-gray-500 mb-4">
              Build a formula using fields, operators, and functions. Reference fields using {'{'}fieldName{'}'}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Available Fields */}
            <div>
              <label className="block text-sm font-medium mb-2">Available Fields</label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                {availableFields.length === 0 ? (
                  <p className="text-sm text-gray-500">No fields available</p>
                ) : (
                  <div className="space-y-1">
                    {availableFields.map((field) => (
                      <button
                        key={field.fieldName}
                        onClick={() => insertField(field.fieldName)}
                        className="w-full text-left px-2 py-1 text-sm hover:bg-blue-50 rounded flex items-center justify-between"
                      >
                        <span>{field.label}</span>
                        <span className="text-xs text-gray-500">{field.dataType}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Operators */}
            <div>
              <label className="block text-sm font-medium mb-2">Operators</label>
              <div className="border rounded-lg p-3">
                <div className="grid grid-cols-4 gap-2">
                  {operators.map((op) => (
                    <button
                      key={op.symbol}
                      onClick={() => insertOperator(op.symbol)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-mono"
                      title={op.label}
                    >
                      {op.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Functions */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Functions</label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {functions.map((func) => (
                  <button
                    key={func.name}
                    onClick={() => insertFunction(func.name)}
                    className="text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded text-sm"
                    title={func.description}
                  >
                    <div className="font-mono font-semibold">{func.name}</div>
                    <div className="text-xs text-gray-600">{func.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Formula Input */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Formula</label>
            <textarea
              value={formulaText}
              onChange={(e) => {
                setFormulaText(e.target.value)
                setError(null)
              }}
              className={`w-full border rounded-lg px-3 py-2 font-mono text-sm ${
                error ? 'border-red-500' : ''
              }`}
              rows={4}
              placeholder="Example: {amount} * 1.1 + {tax}"
            />
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Use {'{'}fieldName{'}'} to reference fields, e.g., {'{'}amount{'}'} + {'{'}tax{'}'}
            </p>
          </div>

          {/* Preview */}
          {formulaText && !error && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium mb-1">Preview</label>
              <div className="text-sm font-mono text-gray-700">{formulaText}</div>
            </div>
          )}
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
            Save Formula
          </button>
        </div>
      </div>
    </div>
  )
}

