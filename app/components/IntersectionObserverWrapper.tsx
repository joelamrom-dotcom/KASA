'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'

interface IntersectionObserverWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  rootMargin?: string
  threshold?: number
  triggerOnce?: boolean
}

/**
 * Lazy load components using Intersection Observer
 * Only renders children when they enter viewport
 */
export default function IntersectionObserverWrapper({
  children,
  fallback = null,
  rootMargin = '50px',
  threshold = 0.1,
  triggerOnce = true,
}: IntersectionObserverWrapperProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            setHasBeenVisible(true)
            observer.disconnect()
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { rootMargin, threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [rootMargin, threshold, triggerOnce])

  return (
    <div ref={ref}>
      {(isVisible || hasBeenVisible) ? children : fallback}
    </div>
  )
}

