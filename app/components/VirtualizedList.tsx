'use client'

import { List } from 'react-window'
import type { RowComponentProps } from 'react-window'
import { useMemo } from 'react'

interface VirtualizedListProps<T> {
  items: T[]
  height: number
  itemHeight: number | ((index: number) => number)
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
  variableHeight?: boolean
}

/**
 * Virtualized list component for rendering large lists efficiently
 * Only renders visible items, dramatically improving performance
 * Uses react-window v2 API
 */
export default function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  className = '',
  variableHeight = false,
}: VirtualizedListProps<T>) {
  const Row = ({ index, style }: RowComponentProps) => {
    const item = items[index]
    return (
      <div style={style}>
        {renderItem(item, index)}
      </div>
    )
  }

  const getItemHeight = useMemo(() => {
    if (typeof itemHeight === 'function') {
      return (index: number) => itemHeight(index)
    }
    return itemHeight
  }, [itemHeight])

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <p className="text-gray-500">No items to display</p>
      </div>
    )
  }

  return (
    <List
      defaultHeight={height}
      rowCount={items.length}
      rowHeight={getItemHeight}
      overscanCount={overscan}
      className={className}
      rowComponent={Row}
      rowProps={{}}
      style={{ height }}
    />
  )
}

/**
 * Hook for calculating optimal item height
 */
export function useItemHeight<T>(
  items: T[],
  defaultHeight: number = 50,
  minHeight: number = 40,
  maxHeight: number = 200
) {
  return useMemo(() => {
    // You can customize this logic based on your data
    // For now, return default height
    return defaultHeight
  }, [items.length, defaultHeight])
}

