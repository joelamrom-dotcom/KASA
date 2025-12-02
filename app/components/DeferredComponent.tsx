'use client'

import { useEffect, useState, ReactNode } from 'react'

interface DeferredComponentProps {
  children: ReactNode
  fallback?: ReactNode
  delay?: number
}

/**
 * Defer component rendering until after initial page load
 * Improves Time to Interactive (TTI)
 */
export default function DeferredComponent({
  children,
  fallback = null,
  delay = 0,
}: DeferredComponentProps) {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    // Wait for next frame to ensure page is interactive
    const timer = setTimeout(() => {
      setShouldRender(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return shouldRender ? <>{children}</> : <>{fallback}</>
}

