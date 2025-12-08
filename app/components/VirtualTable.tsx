'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

// Dynamic import to avoid SSR issues with react-window
const List: any = dynamic(() => import('react-window').then(mod => mod.List), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded" />
})

interface Column<T> {
  key: keyof T | string
  header: string
  width?: number
  render?: (item: T) => React.ReactNode
}

interface VirtualTableProps<T> {
  data: T[]
  columns: Column<T>[]
  rowHeight?: number
  onRowClick?: (item: T) => void
  onRowHover?: (item: T | null) => void
  className?: string
}

export default function VirtualTable<T extends { _id?: string; id?: string }>({
  data,
  columns,
  rowHeight = 60,
  onRowClick,
  onRowHover,
  className = ''
}: VirtualTableProps<T>) {
  const [listHeight, setListHeight] = useState(600)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate list height dynamically
  useEffect(() => {
    if (containerRef.current) {
      const updateHeight = () => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const availableHeight = window.innerHeight - rect.top - 100
          setListHeight(Math.max(400, availableHeight))
        }
      }
      
      updateHeight()
      window.addEventListener('resize', updateHeight)
      return () => window.removeEventListener('resize', updateHeight)
    }
  }, [])

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = data[index]
    const itemId = (item._id || item.id || index) as string

    return (
      <div
        style={style}
        className={`
          flex items-center border-b hover:bg-gray-50 cursor-pointer transition-colors
          ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}
        `}
        onClick={() => onRowClick?.(item)}
        onMouseEnter={() => onRowHover?.(item)}
        onMouseLeave={() => onRowHover?.(null)}
        key={itemId}
      >
        {columns.map((column, colIndex) => {
          const width = column.width || `${100 / columns.length}%`
          const value = column.render 
            ? column.render(item)
            : String((item as any)[column.key] || '')

          return (
            <div
              key={`${itemId}-${column.key as string}-${colIndex}`}
              className="px-4 py-2 text-sm truncate"
              style={{ width }}
              title={typeof value === 'string' ? value : undefined}
            >
              {value}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`virtual-table ${className}`}>
      {/* Table Header */}
      <div className="flex items-center bg-gray-100 border-b border-gray-300 font-semibold sticky top-0 z-10">
        {columns.map((column, index) => {
          const width = column.width || `${100 / columns.length}%`
          return (
            <div
              key={`header-${column.key as string}-${index}`}
              className="px-4 py-3 text-sm text-gray-700 truncate"
              style={{ width }}
            >
              {column.header}
            </div>
          )
        })}
      </div>

      {/* Virtual List */}
      {data.length > 0 ? (
        <List
          height={listHeight}
          itemCount={data.length}
          itemSize={rowHeight}
          width="100%"
          overscanCount={5} // Render 5 extra items for smooth scrolling
        >
          {Row}
        </List>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      )}
    </div>
  )
}

// Export a simpler AutoSizer wrapper for responsive tables
export function ResponsiveVirtualTable<T extends { _id?: string; id?: string }>(
  props: Omit<VirtualTableProps<T>, 'height'>
) {
  return (
    <div className="h-full w-full">
      <VirtualTable {...props} />
    </div>
  )
}
