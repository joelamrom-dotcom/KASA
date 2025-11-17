'use client'

import { 
  InboxIcon, 
  MagnifyingGlassIcon, 
  PlusIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline'

interface EmptyStateProps {
  icon?: 'inbox' | 'search' | 'add' | 'warning'
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction
}: EmptyStateProps) {
  const icons = {
    inbox: InboxIcon,
    search: MagnifyingGlassIcon,
    add: PlusIcon,
    warning: ExclamationCircleIcon
  }

  const Icon = icons[icon]

  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {actionLabel}
        </button>
      )}
    </div>
  )
}

