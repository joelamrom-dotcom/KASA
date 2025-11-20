'use client'

import {
  TableCellsIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ViewColumnsIcon
} from '@heroicons/react/24/outline'

export type ViewType = 'table' | 'kanban' | 'card' | 'list'

interface ViewSwitcherProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  availableViews?: ViewType[]
  className?: string
}

const viewOptions: Array<{ type: ViewType; label: string; icon: any }> = [
  { type: 'table', label: 'Table', icon: TableCellsIcon },
  { type: 'kanban', label: 'Kanban', icon: ViewColumnsIcon },
  { type: 'card', label: 'Cards', icon: Squares2X2Icon },
  { type: 'list', label: 'List', icon: ListBulletIcon },
]

export default function ViewSwitcher({
  currentView,
  onViewChange,
  availableViews = ['table', 'kanban', 'card', 'list'],
  className = ''
}: ViewSwitcherProps) {
  const filteredViews = viewOptions.filter(v => availableViews.includes(v.type))

  return (
    <div className={`flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-1 shadow-sm ${className}`}>
      {filteredViews.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          onClick={() => onViewChange(type)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            currentView === type
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title={label}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

