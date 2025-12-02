'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { FixedSizeList, VariableSizeList } from 'react-window'

interface UseVirtualScrollOptions {
  itemHeight?: number | ((index: number) => number)
  containerHeight?: number
  overscan?: number
}

export function useVirtualScroll<T>(
  items: T[],
  options: UseVirtualScrollOptions = {}
) {
  const {
    itemHeight = 50,
    containerHeight = 600,
    overscan = 5,
  } = options

  const listRef = useRef<FixedSizeList | VariableSizeList>(null)

  const scrollToIndex = useCallback((index: number) => {
    listRef.current?.scrollToItem(index, 'smart')
  }, [])

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToItem(0)
  }, [])

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToItem(items.length - 1)
  }, [items.length])

  return {
    listRef,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    itemHeight,
    containerHeight,
    overscan,
  }
}

