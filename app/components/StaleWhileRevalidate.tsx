'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * Stale-while-revalidate pattern
 * Shows cached data immediately, updates in background
 */
export function useStaleWhileRevalidate<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    staleTime?: number
    cacheTime?: number
  } = {}
) {
  const { staleTime = 60000, cacheTime = 300000 } = options
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map())

  useEffect(() => {
    // Check cache first
    const cached = cacheRef.current.get(key)
    const now = Date.now()

    if (cached && now - cached.timestamp < cacheTime) {
      // Use cached data immediately
      setData(cached.data)
      setIsLoading(false)

      // Revalidate in background if stale
      if (now - cached.timestamp > staleTime) {
        fetchFn()
          .then((newData) => {
            cacheRef.current.set(key, { data: newData, timestamp: now })
            setData(newData)
          })
          .catch(console.error)
      }
    } else {
      // No cache or expired, fetch fresh data
      setIsLoading(true)
      fetchFn()
        .then((newData) => {
          cacheRef.current.set(key, { data: newData, timestamp: now })
          setData(newData)
          setIsLoading(false)
        })
        .catch((error) => {
          console.error('Fetch error:', error)
          setIsLoading(false)
        })
    }
  }, [key, staleTime, cacheTime])

  return { data, isLoading }
}

