'use client'

interface CardViewProps<T> {
  items: T[]
  renderCard: (item: T, index: number) => React.ReactNode
  columns?: number
  className?: string
}

export default function CardView<T>({
  items,
  renderCard,
  columns = 3,
  className = ''
}: CardViewProps<T>) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'

  return (
    <div className={`grid ${gridCols} gap-4 ${className}`}>
      {items.map((item, index) => (
        <div key={index}>
          {renderCard(item, index)}
        </div>
      ))}
    </div>
  )
}

