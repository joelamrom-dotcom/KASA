'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Cache warming component
 * Pre-populates caches for likely next pages
 */
export default function CacheWarmer() {
  const router = useRouter()

  useEffect(() => {
    // Warm cache for likely next pages
    const likelyRoutes = [
      '/families',
      '/payments',
      '/dashboard',
      '/analytics',
    ]

    // Prefetch routes in background
    const warmCache = () => {
      likelyRoutes.forEach((route) => {
        router.prefetch(route)
      })
    }

    // Warm cache after page is interactive
    if (document.readyState === 'complete') {
      warmCache()
    } else {
      window.addEventListener('load', warmCache)
      return () => window.removeEventListener('load', warmCache)
    }
  }, [router])

  return null
}

