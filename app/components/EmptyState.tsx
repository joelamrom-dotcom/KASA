'use client'

import {
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const defaultIcons = {
  document: DocumentTextIcon,
  users: UserGroupIcon,
  payment: CurrencyDollarIcon,
  calendar: CalendarIcon,
  inbox: InboxIcon,
  search: MagnifyingGlassIcon,
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  const IconComponent = typeof icon === 'string' && icon in defaultIcons 
    ? defaultIcons[icon as keyof typeof defaultIcons]
    : null

  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="flex justify-center mb-4">
        {icon ? (
          typeof icon === 'string' && IconComponent ? (
            <IconComponent className="h-16 w-16 text-gray-400 dark:text-gray-600" />
          ) : (
            icon
          )
        ) : (
          <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <InboxIcon className="h-8 w-8 text-gray-400 dark:text-gray-600" />
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex gap-3 justify-center">
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all"
            >
              <PlusIcon className="h-4 w-4" />
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
