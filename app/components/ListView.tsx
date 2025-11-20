'use client'

interface ListViewProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  divider?: boolean
}

export default function ListView<T>({
  items,
  renderItem,
  className = '',
  divider = true
}: ListViewProps<T>) {
  return (
    <div className={`space-y-0 ${className}`}>
      {items.map((item, index) => (
        <div key={index}>
          <div className="py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            {renderItem(item, index)}
          </div>
          {divider && index < items.length - 1 && (
            <div className="border-b border-gray-200 dark:border-gray-700" />
          )}
        </div>
      ))}
    </div>
  )
}

