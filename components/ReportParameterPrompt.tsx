'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ReportParameter {
  name: string
  label: string
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'picklist'
  defaultValue?: any
  required: boolean
  picklistValues?: string[]
  promptText?: string
}

interface ReportParameterPromptProps {
  parameters: ReportParameter[]
  onConfirm: (values: Record<string, any>) => void
  onCancel: () => void
}

export default function ReportParameterPrompt({
  parameters,
  onConfirm,
  onCancel,
}: ReportParameterPromptProps) {
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    parameters.forEach((param) => {
      initial[param.name] = param.defaultValue ?? (param.dataType === 'boolean' ? false : '')
    })
    return initial
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    parameters.forEach((param) => {
      if (param.required && (values[param.name] === undefined || values[param.name] === '')) {
        newErrors[param.name] = `${param.label} is required`
      }

      if (param.dataType === 'number' && values[param.name] !== '' && isNaN(Number(values[param.name]))) {
        newErrors[param.name] = `${param.label} must be a number`
      }

      if (param.dataType === 'date' && values[param.name] && isNaN(Date.parse(values[param.name]))) {
        newErrors[param.name] = `${param.label} must be a valid date`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      onConfirm(values)
    }
  }

  const renderInput = (param: ReportParameter) => {
    const value = values[param.name]
    const error = errors[param.name]

    switch (param.dataType) {
      case 'boolean':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleChange(param.name, e.target.checked)}
              className="mr-2"
            />
            <span>{param.label}</span>
          </label>
        )

      case 'picklist':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleChange(param.name, e.target.value)}
            className={`w-full border rounded px-3 py-2 ${error ? 'border-red-500' : ''}`}
          >
            <option value="">Select {param.label}</option>
            {param.picklistValues?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(param.name, e.target.value)}
            className={`w-full border rounded px-3 py-2 ${error ? 'border-red-500' : ''}`}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(param.name, e.target.value)}
            className={`w-full border rounded px-3 py-2 ${error ? 'border-red-500' : ''}`}
          />
        )

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(param.name, e.target.value)}
            className={`w-full border rounded px-3 py-2 ${error ? 'border-red-500' : ''}`}
            placeholder={`Enter ${param.label.toLowerCase()}`}
          />
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Report Parameters</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {parameters.map((param) => (
            <div key={param.name}>
              <label className="block text-sm font-medium mb-1">
                {param.label}
                {param.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {param.promptText && (
                <p className="text-xs text-gray-500 mb-1">{param.promptText}</p>
              )}
              {renderInput(param)}
              {errors[param.name] && (
                <p className="text-xs text-red-500 mt-1">{errors[param.name]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Run Report
          </button>
        </div>
      </div>
    </div>
  )
}

