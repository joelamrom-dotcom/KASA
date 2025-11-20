'use client'

import {
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  onClose?: () => void
  dismissible?: boolean
  className?: string
}

const typeConfig = {
  info: {
    icon: InformationCircleIcon,
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-400',
    titleColor: 'text-blue-800 dark:text-blue-200',
  },
  success: {
    icon: CheckCircleIcon,
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    iconColor: 'text-green-400',
    titleColor: 'text-green-800 dark:text-green-200',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    iconColor: 'text-yellow-400',
    titleColor: 'text-yellow-800 dark:text-yellow-200',
  },
  error: {
    icon: XCircleIcon,
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-400',
    titleColor: 'text-red-800 dark:text-red-200',
  },
}

export default function Alert({
  type = 'info',
  title,
  children,
  onClose,
  dismissible = false,
  className = '',
}: AlertProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div
      className={`
        ${config.bg} ${config.border} ${config.text}
        border rounded-lg p-4
        ${className}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
        <div className="flex-1">
          {title && (
            <h3 className={`font-semibold mb-1 ${config.titleColor}`}>{title}</h3>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${config.text} hover:opacity-70 transition-opacity`}
            aria-label="Dismiss alert"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}

