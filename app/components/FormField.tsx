'use client'

import { useState } from 'react'
import { ExclamationCircleIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import Tooltip from './Tooltip'

interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'textarea' | 'select'
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  error?: string
  helperText?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  tooltip?: string
  options?: { value: string; label: string }[]
  rows?: number
  className?: string
  showPasswordToggle?: boolean
}

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  helperText,
  placeholder,
  required = false,
  disabled = false,
  tooltip,
  options,
  rows = 4,
  className = '',
  showPasswordToggle = false,
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const inputId = `field-${name}`
  const hasError = !!error
  const isValid = !hasError && value && isFocused

  const baseInputClasses = `
    w-full px-4 py-2 border rounded-lg transition-all
    focus:ring-2 focus:outline-none
    ${hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-200 dark:border-red-700 dark:focus:border-red-600 dark:focus:ring-red-900/20'
      : isValid
      ? 'border-green-300 focus:border-green-500 focus:ring-green-200 dark:border-green-700 dark:focus:border-green-600 dark:focus:ring-green-900/20'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200 dark:border-gray-700 dark:focus:border-blue-600 dark:focus:ring-blue-900/20'
    }
    ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60' : 'bg-white dark:bg-gray-900'}
    text-gray-900 dark:text-gray-100
  `

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          id={inputId}
          name={name}
          value={value as string}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={baseInputClasses}
        />
      )
    }

    if (type === 'select') {
      return (
        <select
          id={inputId}
          name={name}
          value={value as string}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        >
          <option value="">{placeholder || 'Select an option'}</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    const inputType = type === 'password' && showPassword ? 'text' : type

    return (
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${baseInputClasses} ${showPasswordToggle && type === 'password' ? 'pr-10' : ''}`}
        />
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {tooltip && (
          <span className="ml-2">
            <Tooltip content={tooltip} showIcon />
          </span>
        )}
      </label>
      {renderInput()}
      {hasError && (
        <div className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <ExclamationCircleIcon className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      {isValid && (
        <div className="mt-1 flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
          <CheckCircleIcon className="h-4 w-4" />
          <span>Looks good!</span>
        </div>
      )}
      {helperText && !hasError && !isValid && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  )
}
