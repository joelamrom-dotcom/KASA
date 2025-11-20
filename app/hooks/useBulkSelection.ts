'use client'

import { useState, useCallback, useMemo } from 'react'

interface UseBulkSelectionOptions {
  items: any[]
  getItemId: (item: any) => string
  onSelectionChange?: (selectedIds: string[]) => void
}

/**
 * Hook for managing bulk selection of items
 * Provides select all, select none, and individual selection
 */
export function useBulkSelection<T>({
  items,
  getItemId,
  onSelectionChange,
}: UseBulkSelectionOptions) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const selectedCount = selectedIds.size
  const totalCount = items.length
  const isAllSelected = selectedCount === totalCount && totalCount > 0
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount

  const toggleSelection = useCallback(
    (itemId: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(itemId)) {
          next.delete(itemId)
        } else {
          next.add(itemId)
        }
        return next
      })
    },
    []
  )

  const selectAll = useCallback(() => {
    const allIds = new Set(items.map(getItemId))
    setSelectedIds(allIds)
  }, [items, getItemId])

  const selectNone = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      selectNone()
    } else {
      selectAll()
    }
  }, [isAllSelected, selectAll, selectNone])

  const isSelected = useCallback(
    (itemId: string) => {
      return selectedIds.has(itemId)
    },
    [selectedIds]
  )

  const getSelectedItems = useCallback(() => {
    return items.filter((item) => selectedIds.has(getItemId(item)))
  }, [items, selectedIds, getItemId])

  const getSelectedIds = useCallback(() => {
    return Array.from(selectedIds)
  }, [selectedIds])

  // Notify parent of selection changes
  useMemo(() => {
    if (onSelectionChange) {
      onSelectionChange(Array.from(selectedIds))
    }
  }, [selectedIds, onSelectionChange])

  return {
    selectedIds: Array.from(selectedIds),
    selectedCount,
    totalCount,
    isAllSelected,
    isIndeterminate,
    toggleSelection,
    selectAll,
    selectNone,
    toggleSelectAll,
    isSelected,
    getSelectedItems,
    getSelectedIds,
    clearSelection: selectNone,
  }
}

