'use client'

import { useState } from 'react'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  children: (activeTab: string) => React.ReactNode
  className?: string
  variant?: 'default' | 'pills' | 'underline'
}

export default function Tabs({
  tabs,
  defaultTab,
  onChange,
  children,
  className = '',
  variant = 'default',
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  const variantClasses = {
    default: {
      container: 'border-b border-gray-200 dark:border-gray-700',
      tab: (isActive: boolean) =>
        isActive
          ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300',
    },
    pills: {
      container: 'bg-gray-100 dark:bg-gray-800 p-1 rounded-lg',
      tab: (isActive: boolean) =>
        isActive
          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
    },
    underline: {
      container: 'border-b border-gray-200 dark:border-gray-700',
      tab: (isActive: boolean) =>
        isActive
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
    },
  }

  const classes = variantClasses[variant]

  return (
    <div className={className}>
      <div className={classes.container}>
        <nav className="flex -mb-px space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && handleTabChange(tab.id)}
                disabled={tab.disabled}
                className={`
                  flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors
                  ${classes.tab(isActive)}
                  ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.icon && <span className="h-5 w-5">{tab.icon}</span>}
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>
      <div className="mt-4">{children(activeTab)}</div>
    </div>
  )
}

