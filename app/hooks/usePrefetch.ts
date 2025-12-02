'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Prefetch routes on link hover for instant navigation
 */
export function usePrefetch() {
  const router = useRouter()
  const prefetchedRef = useRef<Set<string>>(new Set())

  const prefetch = (href: string) => {
    if (!prefetchedRef.current.has(href)) {
      router.prefetch(href)
      prefetchedRef.current.add(href)
    }
  }

  return { prefetch }
}

/**
 * Hook to prefetch on hover
 */
export function usePrefetchOnHover(href: string) {
  const { prefetch } = usePrefetch()
  const timeoutRef = useRef<NodeJS.Timeout>()

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      prefetch(href)
    }, 100) // Small delay to avoid prefetching on accidental hovers
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { handleMouseEnter, handleMouseLeave }
}

