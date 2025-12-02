'use client'

import { FixedSizeList, ListChildComponentProps } from 'react-window'
import { useMemo } from 'react'

interface VirtualizedListProps<T> {
  items: T[]
  height: number
  itemHeight: number
  renderItem: (props: ListChildComponentProps) => React.ReactElement
  overscanCount?: number
  className?: string
}

export default function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscanCount = 5,
  className = '',
}: VirtualizedListProps<T>) {
  const itemData = useMemo(() => items, [items])

  return (
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      itemData={itemData}
      overscanCount={overscanCount}
      className={className}
    >
      {renderItem}
    </FixedSizeList>
  )
}
