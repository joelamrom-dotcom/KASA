'use client'

import { useState } from 'react'
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface FormFieldProps {
  label: string
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  error?: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
  icon?: React.ReactNode
  validation?: (value: string) => string | null
  as?: 'input' | 'textarea' | 'select'
  options?: { value: string; label: string }[]
}

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error: externalError,
  required = false,
  placeholder,
  disabled = false,
  className = '',
  icon,
  validation,
  as = 'input',
  options
}: FormFieldProps) {
  const [touched, setTouched] = useState(false)
  const [internalError, setInternalError] = useState<string | null>(null)

  const error = externalError || internalError
  const showError = touched && error

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTouched(true)
    if (validation) {
      const validationError = validation(value)
      setInternalError(validationError || null)
    }
    if (onBlur) {
      onBlur(e)
    }
  }

  const baseInputClasses = `
    w-full px-4 py-3 rounded-lg border transition-all duration-300
    ${icon ? 'pl-10' : ''}
    ${showError 
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500'
    }
    ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-800'}
    text-gray-900 dark:text-gray-100
    placeholder-gray-400 dark:placeholder-gray-500
    focus:outline-none focus:ring-2
    ${className}
  `

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        
        {as === 'textarea' ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={baseInputClasses}
            rows={4}
          />
        ) : as === 'select' ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={handleBlur}
            disabled={disabled}
            required={required}
            className={baseInputClasses}
          >
            <option value="">{placeholder || 'Select...'}</option>
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={baseInputClasses}
          />
        )}

        {showError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          </div>
        )}
        
        {touched && !error && value && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          </div>
        )}
      </div>

      {showError && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-slide-in">
          <ExclamationCircleIcon className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  )
}

