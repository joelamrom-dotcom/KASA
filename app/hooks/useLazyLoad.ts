'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseLazyLoadOptions {
  threshold?: number // Distance from bottom to trigger load (in pixels)
  rootMargin?: string // Root margin for IntersectionObserver
  enabled?: boolean // Enable/disable lazy loading
}

/**
 * Hook for lazy loading data as user scrolls
 */
export function useLazyLoad<T>(
  loadMore: (page: number) => Promise<T[]>,
  options: UseLazyLoadOptions = {}
) {
  const {
    threshold = 200,
    rootMargin = '0px',
    enabled = true,
  } = options

  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const observerTarget = useRef<HTMLDivElement>(null)

  const loadPage = useCallback(async (pageNum: number) => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const newItems = await loadMore(pageNum)
      if (newItems.length === 0) {
        setHasMore(false)
      } else {
        setItems(prev => [...prev, ...newItems])
        setPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error loading page:', error)
    } finally {
      setLoading(false)
    }
  }, [loadMore, loading, hasMore])

  useEffect(() => {
    if (!enabled || !hasMore) return

    // Load first page
    loadPage(1)
  }, [enabled]) // Only run once on mount

  useEffect(() => {
    if (!enabled || !hasMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadPage(page)
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1,
      }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [page, hasMore, loading, enabled, threshold, loadPage])

  const reset = useCallback(() => {
    setItems([])
    setPage(1)
    setHasMore(true)
    setLoading(false)
  }, [])

  return {
    items,
    loading,
    hasMore,
    observerTarget,
    reset,
    loadMore: () => loadPage(page),
  }
}

/**
 * Hook for lazy loading images
 */
export function useLazyImage(src: string | null | undefined) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!src) {
      setImageSrc(null)
      setIsLoaded(false)
      setError(false)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setImageSrc(src)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px',
      }
    )

    const currentImg = imgRef.current
    if (currentImg) {
      observer.observe(currentImg)
    }

    return () => {
      if (currentImg) {
        observer.unobserve(currentImg)
      }
    }
  }, [src])

  const handleLoad = () => {
    setIsLoaded(true)
    setError(false)
  }

  const handleError = () => {
    setIsLoaded(false)
    setError(true)
  }

  return {
    imgRef,
    imageSrc,
    isLoaded,
    error,
    handleLoad,
    handleError,
  }
}

