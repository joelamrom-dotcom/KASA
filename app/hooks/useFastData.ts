'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { loadData, loadDataParallel, prefetchData, loadDataPrioritized } from '@/lib/data-loader'

interface UseFastDataOptions {
  cache?: boolean
  cacheTTL?: number
  enabled?: boolean
  refetchOnMount?: boolean
  prefetch?: boolean
  priority?: 'high' | 'low'
}

/**
 * Ultra-fast data loading hook with all optimizations
 */
export function useFastData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseFastDataOptions = {}
) {
  const {
    cache = true,
    cacheTTL = 300000,
    enabled = true,
    refetchOnMount = false,
    prefetch: shouldPrefetch = false,
    priority = 'high',
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return

    try {
      if (!force && !refetchOnMount && data !== null) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const result = await loadData(
        key,
        fetchFn,
        { cache, cacheTTL, dedupe: true }
      )

      if (mountedRef.current) {
        setData(result)
        setLoading(false)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
        setLoading(false)
      }
    }
  }, [key, fetchFn, cache, cacheTTL, enabled, refetchOnMount, data])

  // Prefetch on mount if enabled
  useEffect(() => {
    if (shouldPrefetch && priority === 'low') {
      prefetchData(key, fetchFn, { cache, cacheTTL })
    }
  }, [key, fetchFn, shouldPrefetch, priority, cache, cacheTTL])

  // Load data on mount
  useEffect(() => {
    if (priority === 'high' || !shouldPrefetch) {
      fetchData(refetchOnMount)
    }
  }, [fetchData, refetchOnMount, priority, shouldPrefetch])

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refetch = useCallback(() => {
    fetchData(true)
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch,
  }
}

/**
 * Load multiple data sources in parallel
 */
export function useFastDataParallel<T extends Record<string, any>>(
  loaders: Record<keyof T, () => Promise<T[keyof T]>>,
  options: UseFastDataOptions = {}
) {
  const {
    cache = true,
    cacheTTL = 300000,
    enabled = true,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    if (!enabled) return

    const loadAll = async () => {
      try {
        setLoading(true)
        setError(null)

        const result = await loadDataParallel(loaders, { cache, cacheTTL })

        if (mountedRef.current) {
          setData(result)
          setLoading(false)
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
      }
    }

    loadAll()

    return () => {
      mountedRef.current = false
    }
  }, [JSON.stringify(Object.keys(loaders)), cache, cacheTTL, enabled])

  return {
    data,
    loading,
    error,
  }
}

/**
 * Load critical data first, background data later
 */
export function useFastDataPrioritized<T>(
  criticalKey: string,
  criticalFn: () => Promise<T>,
  backgroundLoaders: Array<{ key: string; fetchFn: () => Promise<any> }> = [],
  options: UseFastDataOptions = {}
) {
  const {
    cache = true,
    cacheTTL = 300000,
    enabled = true,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    if (!enabled) return

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const background = backgroundLoaders.map(({ fetchFn }) => fetchFn)

        const result = await loadDataPrioritized(
          criticalFn,
          background
        )

        if (mountedRef.current) {
          setData(result)
          setLoading(false)
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      mountedRef.current = false
    }
  }, [criticalKey, enabled, cache, cacheTTL])

  return {
    data,
    loading,
    error,
  }
}

