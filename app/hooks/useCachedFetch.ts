'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCachedData, setCachedData, CacheKeys } from '@/lib/cache'
import { performanceMonitor } from '@/lib/performance'

interface UseCachedFetchOptions {
  cacheKey?: string
  ttl?: number // Time to live in milliseconds
  enabled?: boolean
  refetchOnMount?: boolean
}

/**
 * Hook for fetching data with caching
 * Automatically caches responses and serves from cache when available
 */
export function useCachedFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseCachedFetchOptions = {}
) {
  const {
    cacheKey,
    ttl = 5 * 60 * 1000, // 5 minutes default
    enabled = true,
    refetchOnMount = false,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return

    const key = cacheKey || 'default'
    const end = performanceMonitor.start(`fetch:${key}`)

    // Check cache first
    if (!force && cacheKey) {
      const cached = getCachedData<T>(cacheKey)
      if (cached !== null) {
        setData(cached)
        setLoading(false)
        setError(null)
        end({ cached: true })
        return
      }
    }

    try {
      setLoading(true)
      setError(null)

      const result = await fetchFn()
      
      setData(result)
      
      // Cache the result
      if (cacheKey) {
        setCachedData(cacheKey, result, ttl)
      }

      end({ cached: false })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      end({ error: error.message })
    } finally {
      setLoading(false)
    }
  }, [fetchFn, cacheKey, ttl, enabled])

  useEffect(() => {
    fetchData(refetchOnMount)
  }, [fetchData, refetchOnMount])

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
 * Hook for fetching families with caching
 */
export function useCachedFamilies(userId?: string) {
  return useCachedFetch(
    async () => {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/families', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to fetch families')
      return res.json()
    },
    {
      cacheKey: CacheKeys.families(userId),
      ttl: 2 * 60 * 1000, // 2 minutes
    }
  )
}

/**
 * Hook for fetching payments with caching
 */
export function useCachedPayments(userId?: string, filters?: string) {
  return useCachedFetch(
    async () => {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/payments', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to fetch payments')
      return res.json()
    },
    {
      cacheKey: CacheKeys.payments(userId, filters),
      ttl: 2 * 60 * 1000, // 2 minutes
    }
  )
}

